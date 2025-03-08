package layout

import (
	"errors"
	"log"
	"sync"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
)

type Service struct {
	kvStore KeyValueStore
	sys     System
	options *Options
	once    *sync.Once
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

type System interface {
	GetResolution() (system.Resolution, error)
}

type Options struct {
	ForceResolution bool
	Width           int
	Height          int
	Configurations  []Configuration `validate:"required"`
}

func (opt Options) validate() error {
	if opt.ForceResolution && (opt.Width == 0 || opt.Height == 0) {
		return errors.New("width and height must be set when forcing resolution")
	}

	if len(opt.Configurations) == 0 {
		return errors.New("configurations is empty")
	}

	return nil
}

func MakeService(keyValueStore KeyValueStore, sys System, options Options) (Service, error) {
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore is nil")
	}
	if sys == nil {
		return Service{}, errors.New("sys is nil")
	}
	err := options.validate()
	if err != nil {
		return Service{}, err
	}
	svc := Service{
		kvStore: keyValueStore,
		sys:     sys,
		options: &options,
		once:    &sync.Once{},
	}
	return svc, nil
}

func (svc Service) GetDefaultTheme() (v2.Theme, error) {
	svc.once.Do(func() {
		if !svc.options.ForceResolution {
			resolution, err := svc.sys.GetResolution()
			if err != nil {
				log.Printf("Failed to get resolution, falling back to 800x480: %s", err)
				svc.options.Width = 800
				svc.options.Height = 480
				return
			}
			log.Printf("system resolution: %dx%d", resolution.Width, resolution.Height)
			svc.options.Width = resolution.Width
			svc.options.Height = resolution.Height
		}
	})

	for _, layout := range svc.options.Configurations {
		criteria := Criteria{
			Width:  svc.options.Width,
			Height: svc.options.Height,
		}
		if layout.IsSuitable(criteria) {
			return layout.Layout, nil
		}
	}
	return v2.Theme{}, errors.New("no suitable layout")
}
