package telemetry

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"gorm.io/gorm"
)

type TelemetryDaemon struct {
	keyValueStore KeyValueStore
	api           v2.ClientWithResponsesInterface
	sys           System

	lastSuccessfulUpdateAt time.Time
	lastAttemptTimeAt      time.Time
	lastSentDeviceUUID     string
}

type System interface {
	GetResolution() (system.Resolution, error)
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func MakeTelemetryDaemon() (TelemetryDaemon, error) {
	return TelemetryDaemon{}, nil
}

func (d *TelemetryDaemon) Start() {
	for range time.Tick(time.Second) {
		err := d.doTick()
		if err != nil {
			log.Printf("telemetry daemon error: %v", err)
		}
	}
}

func (d *TelemetryDaemon) doTick() error {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*5)
	defer cancel()
	ready, err := d.isReadyToSend(ctx)
	if err != nil {
		return err
	}

	if !ready {
		return nil
	}

	return d.sendTelemetry(ctx)
}

func (d *TelemetryDaemon) isReadyToSend(ctx context.Context) (bool, error) {
	myDeviceUUID, err := d.keyValueStore.Get(store.DeviceUUIDKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, fmt.Errorf("failed to get my device uuid: %w", err)
	}

	if myDeviceUUID == "" {
		return false, nil
	}

	successTimeout := time.Hour * 6
	if time.Since(d.lastAttemptTimeAt) < successTimeout && d.lastSentDeviceUUID == myDeviceUUID {
		return false, nil
	}

	attemptTimeout := time.Minute * 5
	if time.Since(d.lastAttemptTimeAt) < attemptTimeout {
		return false, nil
	}

	return true, nil
}

func (d *TelemetryDaemon) sendTelemetry(ctx context.Context) error {
	myDeviceUUID, err := d.keyValueStore.Get(store.DeviceUUIDKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to get my device uuid: %w", err)
	}

	if myDeviceUUID == "" {
		return fmt.Errorf("my device uuid is empty")
	}

	resolution, err := d.sys.GetResolution()
	if err != nil {
		return fmt.Errorf("failed to get resolution: %w", err)
	}

	d.lastAttemptTimeAt = time.Now()

	// TODO where is the principal UUID?
	request := v2.CreateDeviceTelemetryJSONRequestBody{
		// PrincipalUuid: "",
		DeviceUuid:   myDeviceUUID,
		ScreenWidth:  resolution.Width,
		ScreenHeight: resolution.Height,
	}
	resp, err := d.api.CreateDeviceTelemetryWithResponse(nil, request)
	if err != nil {
		return fmt.Errorf("failed to create device telemetry: %w", err)
	}

	if resp.StatusCode() != http.StatusNoContent {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode())
	}

	d.lastSuccessfulUpdateAt = time.Now()
	d.lastSentDeviceUUID = myDeviceUUID

	return nil
}
