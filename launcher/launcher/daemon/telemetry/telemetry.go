package telemetry

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"gorm.io/gorm"
)

type TelemetryDaemon struct {
	api             v2.ClientInterface
	deviceDataStore DeviceDataStore
	sys             System

	lastSuccessfulUpdateAt time.Time
	lastAttemptTimeAt      time.Time
	lastSentDeviceUUID     string
}

type System interface {
	GetResolution() (system.Resolution, error)
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

func MakeTelemetryDaemon(api v2.ClientInterface, deviceDataStore DeviceDataStore, sys System) (*TelemetryDaemon, error) {
	if api == nil {
		return nil, errors.New("api was nil")
	}
	if deviceDataStore == nil {
		return nil, errors.New("deviceDataStore was nil")
	}
	if sys == nil {
		return nil, errors.New("sys was nil")
	}
	d := &TelemetryDaemon{
		api:             api,
		deviceDataStore: deviceDataStore,
	}
	return d, nil
}

func (d *TelemetryDaemon) Start(ctx context.Context) {
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

func (d *TelemetryDaemon) getDeviceUUID() (string, error) {
	data, err := d.deviceDataStore.GetDeviceData()
	if err != nil {
		return "", fmt.Errorf("failed to get device data: %w", err)
	}

	return data.DeviceProfile.Value.Device.Uuid, nil
}

func (d *TelemetryDaemon) getPrinicpalUUID() (string, error) {
	data, err := d.deviceDataStore.GetDeviceData()
	if err != nil {
		return "", fmt.Errorf("failed to get device data: %w", err)
	}

	return data.DeviceProfile.Value.PrincipalUuid, nil
}

func (d *TelemetryDaemon) isReadyToSend(ctx context.Context) (bool, error) {
	myDeviceUUID, err := d.getDeviceUUID()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, fmt.Errorf("failed to get my device uuid: %w", err)
	}

	if myDeviceUUID == "" {
		return false, nil
	}

	myPrincipalUUID, err := d.getPrinicpalUUID()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, fmt.Errorf("failed to get my principal uuid: %w", err)
	}

	if myPrincipalUUID == "" {
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
	myDeviceUUID, err := d.getDeviceUUID()
	if err != nil {
		return fmt.Errorf("failed to get device uuid: %w", err)
	}

	myPrincipalUUID, err := d.getPrinicpalUUID()
	if err != nil {
		return fmt.Errorf("failed to get principal uuid: %w", err)
	}

	if myDeviceUUID == "" {
		return fmt.Errorf("my device uuid is empty")
	}

	resolution, err := d.sys.GetResolution()
	if err != nil {
		return fmt.Errorf("failed to get resolution: %w", err)
	}

	d.lastAttemptTimeAt = time.Now()

	request := v2.CreateDeviceTelemetryJSONRequestBody{
		PrincipalUuid: myPrincipalUUID,
		DeviceUuid:    myDeviceUUID,
		ScreenWidth:   resolution.Width,
		ScreenHeight:  resolution.Height,
	}
	resp, err := d.api.CreateDeviceTelemetry(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create device telemetry: %w", err)
	}

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("unexpected status code: %d", resp)
	}

	d.lastSuccessfulUpdateAt = time.Now()
	d.lastSentDeviceUUID = myDeviceUUID

	return nil
}
