package service

import "github.com/johnny-morrice/timechief-client/client/viewmodel"

type APIService struct {
}

type LauncherState struct {
	Flags []string
}

type Target struct {
	TargetRoot string
	LogFile    string
}

type TargetStatus struct {
	Ready bool
}

type DeviceData struct {
	ServiceData   viewmodel.ClockData
	LauncherState LauncherState
}

func (svc APIService) GetDeviceData() (*viewmodel.ClockData, error) {
	return nil, nil
}

func (svc APIService) GetTarget() (Target, error) {
	return Target{}, nil
}

func (svc APIService) RecoverTarget() (TargetStatus, error) {
	return TargetStatus{}, nil
}
