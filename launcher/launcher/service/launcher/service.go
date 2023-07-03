package launcher

import (
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Service struct {
	LaunchTargetStore store.LaunchTargetStore
	StateFlagStore    store.StateFlagStore
	KeyValueStore     store.KeyValueStore
	CfgStore          store.ConfigStore
	SoundService      SoundService
}

type SoundService interface {
	PlayLogin() error
}

type TargetStatus struct {
	Ready bool
}

func (svc Service) OnLogin() error {
	return svc.SoundService.PlayLogin()
}

func (svc Service) SetSetupState(state string) error {
	return svc.KeyValueStore.Set("setup", state)
}

func (svc Service) GetTarget() (service.LaunchTarget, error) {
	target, err := svc.LaunchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return service.LaunchTarget{}, err
	}

	result := service.LaunchTargetFromStore(target)

	return result, nil
}

func (svc Service) GetConfig() (store.Config, error) {
	config, err := svc.CfgStore.GetConfig()
	if err != nil {
		return store.Config{}, err
	}

	return config, nil
}

func (svc Service) RecoverTarget() (TargetStatus, error) {
	return TargetStatus{Ready: true}, nil
}
