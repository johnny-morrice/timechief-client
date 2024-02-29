package picture

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	keyValueStore KeyValueStore
	filesystem    media.FS
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func MakeService(keyValueStore KeyValueStore, filesystem media.FS) (Service, error) {
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore must not be nil")
	}
	if filesystem == nil {
		return Service{}, errors.New("filesystem must not be nil")
	}
	svc := Service{
		keyValueStore: keyValueStore,
		filesystem:    filesystem,
	}
	return svc, nil
}

type PictureMetadata struct {
	UUID     string `json:"uuid"`
	Filename string `json:"filename"`
	Format   string `json:"format"`
}

func (svc Service) CheckSHA256(filename string, expected []byte) error {
	return svc.filesystem.CheckSHA256(filename, expected)
}

func (svc Service) List() ([]PictureMetadata, error) {
	videoText, err := svc.keyValueStore.Get(store.VideoDescriptorKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get video descriptor: %w", err)
	}
	if videoText == "" {
		return nil, nil
	}
	pic := PictureDescriptor{}
	err = json.Unmarshal([]byte(videoText), &pic)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal video descriptor: %w", err)
	}
	result := []PictureMetadata{
		{
			UUID:     pic.UUID,
			Filename: pic.Filename,
		},
	}
	return result, nil
}

type Settings struct {
	Enabled     bool   `json:"enabled"`
	PictureMode string `json:"mode"`
}

func (svc Service) GetPreferences() (Settings, error) {
	// If video content is not enabled, do nothing.
	descriptor, err := svc.keyValueStore.Get(store.BackgroundPictureDescriptor)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get background picture descriptor: %w", err)
	}
	// TODO remove forceEnabled
	const forceEnabled = true
	settings := Settings{
		Enabled:     forceEnabled || descriptor != "",
		PictureMode: "fill",
	}
	return settings, nil
}

func (svc Service) Exists(filename string) (bool, error) {
	pictures, err := svc.List()
	if err != nil {
		return false, fmt.Errorf("failed to list pictures: %w", err)
	}
	for _, pic := range pictures {
		if pic.Filename == filename {
			return true, nil
		}
	}

	fs := svc.GetFS()
	// Check if file in filesystem.
	file, err := fs.Open(filename)
	if err != nil {
		log.Printf("failed to open file %s: %v", filename, err)
		return false, nil
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close file %s: %v", filename, err)
		}
	}()

	return false, nil
}

func (svc Service) GetFS() media.FS {
	return svc.filesystem
}
