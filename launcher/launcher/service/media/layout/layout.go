package layout

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

func applyLayoutToTheme(theme *v2.Theme, layout v2.Theme) error {
	suffixes := []string{"X", "Y", "Width", "Height", "FontSize"}
	err := copyFields(theme, layout, suffixes)
	if err != nil {
		return fmt.Errorf("failed to apply layout to theme: %w", err)
	}
	return nil
}

// Use reflection to copy fields from src to dst.
// dst must be a pointer type to a struct type.
// src must be a struct type.
func copyFields(dst interface{}, src interface{}, suffixes []string) error {
	// Validate inputs
	dstType := reflect.TypeOf(dst)
	if dstType.Kind() != reflect.Ptr {
		return errors.New("dst must be a pointer to a struct type")
	}

	dstType = dstType.Elem()
	if dstType.Kind() != reflect.Struct {
		return errors.New("dst must be a pointer to a struct type")
	}

	srcType := reflect.TypeOf(src)
	if srcType.Kind() != reflect.Struct {
		return errors.New("src must be a struct type")
	}

	dstVal := reflect.ValueOf(dst).Elem()

	srcVal := reflect.ValueOf(src)
	for i := 0; i < srcType.NumField(); i++ {
		srcField := srcType.Field(i)
		srcFieldName := srcField.Name
		for _, suffix := range suffixes {
			if strings.HasSuffix(srcFieldName, suffix) {
				dstField := dstVal.FieldByName(srcFieldName)
				if dstField.IsValid() {
					srcFieldVal := srcVal.Field(i)
					dstField.Set(srcFieldVal)
				}
			}
		}
	}

	return nil
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
	applyLayoutToTheme(theme, config.Layout)
}

type configurator struct {
	layouts []Configuration
}

func (c configurator) configureTheme(theme *v2.Theme, width, height int) error {
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
