package launcher

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/crypt"
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

type LauncherAPIKey struct {
	Key string `json:"key"`
}

type TargetEnv struct {
	Env map[string]string `json:"env"`
}

func (svc Service) GetTargetEnv() (TargetEnv, error) {
	key, err := svc.KeyValueStore.Get(store.APIAppAuthKey)
	if err != nil {
		return TargetEnv{}, fmt.Errorf("failed to get API key: %w", err)
	}
	if key == "" {
		return TargetEnv{}, fmt.Errorf("no API key")
	}
	env := map[string]string{
		"API_KEY": key,
	}
	return TargetEnv{Env: env}, nil
}

func (svc Service) RegenerateUserAPIKey() (LauncherAPIKey, error) {
	theKey, err := crypt.GenerateRandomAPIKey()
	if err != nil {
		return LauncherAPIKey{}, fmt.Errorf("failed to generate API key: %w", err)
	}
	err = svc.KeyValueStore.Set(store.APIUserAuthKey, theKey)
	if err != nil {
		return LauncherAPIKey{}, fmt.Errorf("failed to save API key: %w", err)
	}
	return LauncherAPIKey{Key: theKey}, nil
}

func (svc Service) OnLogin() error {
	done, err := svc.StateFlagStore.Exists("logged-in")
	if err != nil {
		return err
	}
	if done {
		return nil
	}
	err = svc.StateFlagStore.CreateIfNotExists("logged-in")
	if err != nil {
		return err
	}
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

func (svc Service) ChooseNetworkType(networkType string) error {
	if networkType != "wifi" && networkType != "manual" {
		return fmt.Errorf("unsupported network type: %s", networkType)
	}

	return svc.KeyValueStore.Set("network-type", networkType)
}
