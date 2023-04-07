package service

import (
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type APIService struct {
	DeviceDataStore   store.DeviceDataStore
	LaunchTargetStore store.LaunchTargetStore
	StateFlagStore    store.StateFlagStore
	CfgStore          store.ConfigStore
}

type LauncherState struct {
	Flags []string
}

type TargetStatus struct {
	Ready bool
}

type DeviceData struct {
	ServiceData   viewmodel.ClockData
	LauncherState LauncherState
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

	result := DeviceData{
		ServiceData: clockData,
		LauncherState: LauncherState{
			Flags: flags,
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
