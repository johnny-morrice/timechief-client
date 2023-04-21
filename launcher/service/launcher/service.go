package launcher

import (
	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type Service struct {
	LaunchTargetStore store.LaunchTargetStore
	StateFlagStore    store.StateFlagStore
	CfgStore          store.ConfigStore
}
type TargetStatus struct {
	Ready bool
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
