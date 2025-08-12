package websocketwakeup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/authzero"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/websocketv2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Service struct {
	cfgStore      ConfigStore
	adaptiveTick  AdaptiveTick
	keyValueStore KeyValueStore
}

type AdaptiveTick interface {
	Poke()
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

type ConfigStore interface {
	GetConfig() (store.Config, error)
}

func MakeWebsocketWakeupService(cfgStore ConfigStore, adaptiveTick AdaptiveTick, keyValueStore KeyValueStore) (Service, error) {
	if cfgStore == nil {
		return Service{}, errors.New("configStore was nil")
	}
	if adaptiveTick == nil {
		return Service{}, errors.New("adaptiveTick was nil")
	}
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore was nil")
	}
	svc := Service{
		cfgStore:      cfgStore,
		adaptiveTick:  adaptiveTick,
		keyValueStore: keyValueStore,
	}
	return svc, nil
}

func (svc Service) Run(ctx context.Context) {
	err := svc.doRun(ctx)
	if err != nil {
		log.Printf("websocket wakeup service failed: %v", err)
	}
}

func (svc Service) doRun(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	cfg, err := svc.cfgStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	apiBaseURL := cfg.GetAPIBaseURL()
	if apiBaseURL == "" {
		panic("BUG: API base URL is not set in the config")
	}
	authHeaderProvider := func(ctx context.Context) (string, error) {
		accessTokenText, err := svc.keyValueStore.Get(store.AccessTokenKey)
		if err != nil {
			return "", err
		}
		accessToken := authzero.AccessTokenResp{}
		err = json.Unmarshal([]byte(accessTokenText), &accessToken)
		if err != nil {
			return "", fmt.Errorf("failed to decode access token: %v", err)
		}
		return fmt.Sprintf("Bearer %s", accessToken.AccessToken), nil
	}
	deviceUUIDProvider := make(chan string)
	dataVersionCallback := make(chan string)

	client, err := websocketv2.MakeWebsocketClient(
		apiBaseURL,
		authHeaderProvider,
		dataVersionCallback,
		deviceUUIDProvider,
	)

	if err != nil {
		return err
	}

	go client.Run(ctx)

	// Read the incoming data versions
	go func() {
		lastDataVersion := ""
		for dataVersion := range dataVersionCallback {
			if dataVersion != "" && dataVersion == lastDataVersion {
				continue
			}
			lastDataVersion = dataVersion
			log.Printf("websocket wakeup service received new data version: %s", dataVersion)
			svc.adaptiveTick.Poke() // Notify the adaptive tick to adjust its timing
		}
	}()

	// Write the device UUIDs
	ticker := time.NewTicker(time.Second * 10)
	lastDeviceUUID := ""
	defer ticker.Stop()
	for range ticker.C {
		select {
		case <-ctx.Done():
			return nil
		default:
			deviceUUID, err := svc.keyValueStore.Get(store.DeviceUUIDKey)
			if err != nil {
				log.Printf("error getting device UUID: %v", err)
				continue
			}
			if deviceUUID == lastDeviceUUID {
				continue
			}
			lastDeviceUUID = deviceUUID
			if deviceUUID != "" {
				log.Printf("websocket wakeup service now handling device UUID: %s", deviceUUID)
				deviceUUIDProvider <- deviceUUID
			}
		}
	}
	return nil
}
