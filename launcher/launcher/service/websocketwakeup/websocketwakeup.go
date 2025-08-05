package websocketwakeup

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/websocketv2"
)

type Service struct {
	adaptiveTick  AdaptiveTick
	keyValueStore KeyValueStore
	apiBaseURL    string
}

type AdaptiveTick interface {
	Poke()
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func (svc Service) Run() error {
	authHeaderProvider := func(ctx context.Context) (string, error) {
		authHeader, err := svc.keyValueStore.Get("authorization")
		if err != nil {
			return "", err
		}
		if authHeader == "" {
			return "", errors.New("authorization header is empty")
		}
		return authHeader, nil
	}
	deviceUUIDProvider := make(chan string)
	dataVersionCallback := make(chan string)

	client, err := websocketv2.MakeWebsocketClient(
		svc.apiBaseURL,
		authHeaderProvider,
		dataVersionCallback,
		deviceUUIDProvider,
	)

	if err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go client.Run(ctx)

	// Read the incoming data versions
	go func() {
		lastDataVersion := ""
		for dataVersion := range dataVersionCallback {
			if dataVersion != "" && dataVersion == lastDataVersion {
				continue
			}
			lastDataVersion = dataVersion
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
			deviceUUID, err := svc.keyValueStore.Get("device-uuid")
			if err != nil {
				log.Printf("error getting device UUID: %v", err)
				continue
			}
			if deviceUUID == lastDeviceUUID {
				continue
			}
			lastDeviceUUID = deviceUUID
			if deviceUUID != "" {
				deviceUUIDProvider <- deviceUUID
			}
		}
	}
	return nil
}
