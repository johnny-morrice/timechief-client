package layout

import (
	"encoding/json"
	"errors"
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"gorm.io/gorm"
)

type Service struct {
	configurator configurator
	kvStore      KeyValueStore
	defaultTheme v2.Theme
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

func MakeService(defaultTheme v2.Theme, keyValueStore KeyValueStore, configurations []Configuration) (Service, error) {
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore is nil")
	}
	if len(configurations) == 0 {
		return Service{}, errors.New("configurations is empty")
	}
	svc := Service{
		configurator: configurator{
			layouts: configurations,
		},
		kvStore:      keyValueStore,
		defaultTheme: defaultTheme,
	}
	return svc, nil
}

func (svc Service) GetDefaultTheme() (v2.Theme, error) {
	const defaultWidth = 800
	const defaultHeight = 480
	defaultThemeText, err := svc.kvStore.Get("default_theme")
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		err = svc.SetScreenDimensions(defaultWidth, defaultHeight)
		if err != nil {
			return v2.Theme{}, fmt.Errorf("failed to set screen dimensions: %w", err)
		}
		defaultThemeText, err = svc.kvStore.Get("default_theme")
		if err != nil {
			return v2.Theme{}, fmt.Errorf("failed to get default theme: %w", err)
		}
	} else if err != nil {
		return v2.Theme{}, fmt.Errorf("failed to get default theme: %w", err)
	}

	var defaultTheme v2.Theme
	err = json.Unmarshal([]byte(defaultThemeText), &defaultTheme)
	if err != nil {
		return v2.Theme{}, fmt.Errorf("failed to unmarshal default theme: %w", err)
	}

	return defaultTheme, nil
}

func (svc Service) SetScreenDimensions(width, height int) error {
	myTheme := svc.defaultTheme
	err := svc.configurator.configureTheme(&myTheme, width, height)
	if err != nil {
		return err
	}
	textTheme, err := json.MarshalIndent(myTheme, "", "    ")
	if err != nil {
		return fmt.Errorf("failed to marshal theme: %w", err)
	}
	err = svc.kvStore.Set("default_theme", string(textTheme))
	if err != nil {
		return fmt.Errorf("failed to set default theme: %w", err)
	}
	return nil
}
