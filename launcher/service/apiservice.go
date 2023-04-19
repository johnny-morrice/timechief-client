package service

import (
	"errors"
	"fmt"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
)

type APIService struct {
	DeviceDataStore   store.DeviceDataStore
	LaunchTargetStore store.LaunchTargetStore
	StateFlagStore    store.StateFlagStore
	CfgStore          store.ConfigStore
	System            system.System
}

type LauncherState struct {
	Flags               []string
	ActiveTargetVersion string
}

type TargetStatus struct {
	Ready bool
}

type DeviceData struct {
	ServiceData   viewmodel.ClockData
	LauncherState LauncherState
}

type PairingStatus struct {
	Status string
	Code   string
}

func (svc APIService) PairDevice() error {
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

func (svc APIService) GetPairingStatus() (PairingStatus, error) {
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

func (svc APIService) GetDeviceData() (DeviceData, error) {
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

func (svc APIService) GetTarget() (LaunchTarget, error) {
	target, err := svc.LaunchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return LaunchTarget{}, err
	}

	result := LaunchTargetFromStore(target)

	return result, nil
}

func (svc APIService) GetConfig() (store.Config, error) {
	config, err := svc.CfgStore.GetConfig()
	if err != nil {
		return store.Config{}, err
	}

	return config, nil
}

func (svc APIService) RecoverTarget() (TargetStatus, error) {
	return TargetStatus{Ready: true}, nil
}

func (svc APIService) Reboot() error {
	return svc.System.Reboot()
}

func (svc APIService) Shutdown() error {
	return svc.System.Reboot()
}
