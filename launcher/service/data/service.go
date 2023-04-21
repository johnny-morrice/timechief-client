package data

import (
	"errors"
	"fmt"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type Service struct {
	DeviceDataStore   store.DeviceDataStore
	LaunchTargetStore store.LaunchTargetStore
	StateFlagStore    store.StateFlagStore
	CfgStore          store.ConfigStore
}

type LauncherState struct {
	Flags               []string
	ActiveTargetVersion string
	SetupComplete       bool
}

type DeviceData struct {
	ServiceData   viewmodel.ClockData
	LauncherState LauncherState
}

type PairingStatus struct {
	Status string
	Code   string
}

func (svc Service) PairDevice() error {
	cfg, err := svc.CfgStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	cfg.ClearPairingCode()
	err = svc.CfgStore.SetConfig(cfg)
	if err != nil {
		return fmt.Errorf("failed to set config: %w", err)
	}
	err = svc.StateFlagStore.CreateIfNotExists("pairing-requested")
	if err != nil {
		return fmt.Errorf("failed to create pairing-requested flag: %w", err)
	}
	return nil
}

func (svc Service) GetPairingStatus() (PairingStatus, error) {
	config, err := svc.CfgStore.GetConfig()
	if err != nil {
		return PairingStatus{}, fmt.Errorf("failed to get config: %w", err)
	}

	code, err := config.GetPairingCode()
	if err != nil && !errors.Is(err, store.ErrCfgNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}

	isPairing, err := svc.StateFlagStore.Exists("pairing-requested")

	if err != nil {
		return PairingStatus{}, fmt.Errorf("failed to check pairing-requested flag: %w", err)
	}

	status := "none"
	if isPairing {
		status = "ready"
	}

	result := PairingStatus{
		Status: status,
		Code:   code,
	}

	return result, nil
}

func (svc Service) GetDeviceData() (DeviceData, error) {
	clockData, err := svc.DeviceDataStore.GetDeviceData()
	if err != nil {
		return DeviceData{}, err
	}

	flags, err := svc.StateFlagStore.List()
	if err != nil {
		return DeviceData{}, err
	}

	target, err := svc.LaunchTargetStore.GetActiveLaunchTarget()

	if err != nil {
		return DeviceData{}, err
	}

	result := DeviceData{
		ServiceData: clockData,
		LauncherState: LauncherState{
			Flags:               flags,
			ActiveTargetVersion: target.Version.Details(),
		},
	}

	return result, nil
}
