package picture

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	keyValueStore   KeyValueStore
	filesystem      media.FS
	downloader      Downloader
	deviceDataStore DeviceDataStore
}

type Downloader interface {
	Download(ctx context.Context, url string, sha256 []byte) ([]byte, error)
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

func MakeService(keyValueStore KeyValueStore, filesystem media.FS, downloader Downloader, deviceDataStore DeviceDataStore) (Service, error) {
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore must not be nil")
	}
	if filesystem == nil {
		return Service{}, errors.New("filesystem must not be nil")
	}
	if downloader == nil {
		return Service{}, errors.New("downloader must not be nil")
	}
	if deviceDataStore == nil {
		return Service{}, errors.New("deviceDataStore must not be nil")
	}

	svc := Service{
		keyValueStore:   keyValueStore,
		filesystem:      filesystem,
		downloader:      downloader,
		deviceDataStore: deviceDataStore,
	}
	return svc, nil
}

const defaultBackgroundPictureDescriptor = "{}"

func (svc Service) Initialise() error {
	return svc.initKey(store.BackgroundPictureDescriptor, defaultBackgroundPictureDescriptor)
}

func (svc Service) initKey(key, value string) error {
	_, err := svc.keyValueStore.Get(key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = svc.keyValueStore.Set(key, value)
			if err != nil {
				return fmt.Errorf("failed to set default picture key %s: %w", key, err)
			}
			return nil
		}

		return fmt.Errorf("failed to get default picture key %s: %w", key, err)
	}
	return nil
}

type PictureMetadata struct {
	UUID     string `json:"uuid"`
	Filename string `json:"filename"`
}

func (svc Service) CheckSHA256(filename string, expected []byte) error {
	return svc.filesystem.CheckSHA256(filename, expected)
}

func (svc Service) List() ([]PictureMetadata, error) {
	pictureText, err := svc.keyValueStore.Get(store.BackgroundPictureDescriptor)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get picture descriptor: %w", err)
	}
	if pictureText == "" {
		return nil, nil
	}
	pic := PictureDescriptor{}
	err = json.Unmarshal([]byte(pictureText), &pic)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal picture descriptor: %w", err)
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
	Enabled        bool   `json:"enabled"`
	BackgroundSize string `json:"background_size"`
}

func (svc Service) GetPreferences() (Settings, error) {
	descriptorText, err := svc.keyValueStore.Get(store.BackgroundPictureDescriptor)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get background picture descriptor: %w", err)
	}
	data, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get device data: %w", err)
	}
	if descriptorText == "" {
		return Settings{}, nil
	}
	descriptor := PictureDescriptor{}
	err = json.Unmarshal([]byte(descriptorText), &descriptor)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to unmarshal picture descriptor: %w", err)
	}
	theme := data.DeviceProfile.Value.Theme
	enabled := theme.ImageFit == "cover"
	enabled = enabled && len(theme.ImageUuids) > 0
	enabled = enabled && theme.ImageUuids[0] == descriptor.UUID
	settings := Settings{
		Enabled:        enabled,
		BackgroundSize: theme.ImageFit,
	}
	return settings, nil
}

func (svc Service) Exists(filename string) (bool, error) {
	pictures, err := svc.List()
	if err != nil {
		return false, fmt.Errorf("failed to list pictures: %w", err)
	}
	found := false
	for _, pic := range pictures {
		if pic.Filename == filename {
			found = true
			break
		}
	}
	if !found {
		log.Printf("file %s not found in list of pictures", filename)
		return false, nil
	}

	fs := svc.GetFS()
	// Check if file in filesystem.
	file, err := fs.Open(filename)
	if err != nil {
		log.Printf("failed to open file for picture exists check %s: %v", filename, err)
		return false, nil
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close picture file %s: %v", filename, err)
		}
	}()

	return true, nil
}

func (svc Service) GetFS() media.FS {
	return svc.filesystem
}

func (svc Service) Download(picture PictureDescriptor) error {
	// TODO we need to validate the descriptor.
	lastPictureText, err := svc.keyValueStore.Get(store.BackgroundPictureDescriptor)
	if err != nil {
		return fmt.Errorf("failed to get last picture UUID: %w", err)
	}
	lastPicture := PictureDescriptor{}
	err = json.Unmarshal([]byte(lastPictureText), &lastPicture)
	if err != nil {
		return fmt.Errorf("failed to parse stored picture descriptor: %w", err)
	}
	if lastPicture.UUID == picture.UUID {
		err := svc.filesystem.CheckSHA256(picture.Filename, picture.SHA256)
		if err != nil {
			log.Printf("picture sha check failed: %s", err.Error())
		} else {
			log.Printf("picture %s is already downloaded", picture.UUID)
			return nil
		}
	}
	log.Printf("downloading picture %s %s", picture.UUID, picture.URL)
	data, err := svc.downloader.Download(context.Background(), picture.URL, picture.SHA256)
	if err != nil {
		return fmt.Errorf("failed to download picture content: %w", err)
	}
	log.Printf("downloaded picture %s %s", picture.UUID, picture.URL)
	err = svc.filesystem.WriteFile(picture.Filename, data, 0644)
	if err != nil {
		return fmt.Errorf("failed to store picture content: %w", err)
	}
	err = svc.filesystem.CheckSHA256(picture.Filename, picture.SHA256)
	if err != nil {
		return fmt.Errorf("failed to validate picture content: %w", err)
	}
	descriptorText, err := json.Marshal(picture)
	if err != nil {
		return fmt.Errorf("failed to marshal picture descriptor: %w", err)
	}
	err = svc.keyValueStore.Set(store.BackgroundPictureDescriptor, string(descriptorText))
	if err != nil {
		return fmt.Errorf("failed to store picture descriptor: %w", err)
	}
	return nil
}
