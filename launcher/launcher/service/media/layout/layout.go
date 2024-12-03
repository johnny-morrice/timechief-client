package layout

import (
	"errors"
	"fmt"
	"strconv"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"gorm.io/gorm"
)

func ApplyLayoutToTheme(theme *v2.Theme, layout v2.Theme) {
	panic("not implemented")
}

type Configuration struct {
	MinHeight int
	MaxHeight int
	MinWidth  int
	MaxWidth  int
	Layout    v2.Theme
}

func (config Configuration) IsSuitableForSize(width, height int) bool {
	if config.MinWidth >= 0 && width < config.MinWidth {
		return false
	}
	if config.MaxWidth >= 0 && width > config.MaxWidth {
		return false
	}
	if config.MinHeight >= 0 && height < config.MinHeight {
		return false
	}
	if config.MaxHeight >= 0 && height > config.MaxHeight {
		return false
	}
	return true
}

func (config Configuration) ApplyToTheme(theme *v2.Theme) {
	ApplyLayoutToTheme(theme, config.Layout)
}

type Configurator struct {
	layouts []Configuration
}

func (c Configurator) ConfigureTheme(theme *v2.Theme, width, height int) error {
	if !theme.IsDefault {
		return nil
	}
	for _, layout := range c.layouts {
		if layout.IsSuitableForSize(width, height) {
			layout.ApplyToTheme(theme)
			return nil
		}
	}
	return errors.New("no suitable layout found")
}

type DimensionsManager struct {
	kvStore KeyValueStore
}

func (dm DimensionsManager) ApplyDefaultDisplayDimensions(theme *v2.Theme) error {
	// The key value store contains a detected_width and detected_height for the current screen.
	// If the theme IsDefault, the dimensions manager will apply the detected width and height.
	// Otherwise do nothing.
	if theme.IsDefault {
		widthText, err := dm.kvStore.Get("detected_width")
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		heightText, err := dm.kvStore.Get("detected_height")
		if err != nil {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		width, err := strconv.Atoi(widthText)
		if err != nil {
			return fmt.Errorf("failed to parse detected_width %s: %w", widthText, err)
		}
		height, err := strconv.Atoi(heightText)
		if err != nil {
			return fmt.Errorf("failed to parse detected_height %s: %w", heightText, err)
		}
		theme.DisplayWidth = width
		theme.DisplayHeight = height
		return nil
	}
}

type KeyValueStore interface {
	Get(key string) (string, error)
}
