package video

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/util"
	"gorm.io/gorm"
)

type Service struct {
	keyValueStore KeyValueStore
	filesystem    FS
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func MakeService(keyValueStore KeyValueStore, filesystem FS) (Service, error) {
	if keyValueStore == nil {
		return Service{}, errors.New("keyValueStore must not be nil")
	}
	if filesystem == nil {
		return Service{}, errors.New("blobStore must not be nil")
	}
	svc := Service{
		keyValueStore: keyValueStore,
		filesystem:    filesystem,
	}
	return svc, nil
}

type VideoMetadata struct {
	UUID            string `json:"uuid"`
	Filename        string `json:"filename"`
	DurationSeconds int    `json:"duration"`
}

func (svc Service) CheckSHA256(filename string, expected []byte) error {
	file, err := svc.filesystem.Open(filename)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close file: %v", err)
		}
	}()
	hasher := sha256.New()
	_, err = io.Copy(hasher, file)
	if err != nil {
		return fmt.Errorf("failed to hash file: %w", err)
	}
	actual := hasher.Sum(nil)
	if !bytes.Equal(actual, expected) {
		return fmt.Errorf("file '%v' has incorrect hash, expected %x but was %x", filename, expected, actual)
	}
	return nil
}

func (svc Service) ListVideos() ([]VideoMetadata, error) {
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
	video := VideoDescriptor{}
	err = json.Unmarshal([]byte(videoText), &video)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal video descriptor: %w", err)
	}
	result := []VideoMetadata{
		{
			UUID:            video.UUID,
			Filename:        video.Filename,
			DurationSeconds: int(video.Duration.Seconds()),
		},
	}
	return result, nil
}

type Settings struct {
	Enabled          bool `json:"enabled"`
	EnabledHourStart int  `json:"enabled_hour_start"`
	EnabledHourEnd   int  `json:"enabled_hour_end"`
}

func (svc Service) GetVideoPreferences() (Settings, error) {
	// If video content is not enabled, do nothing.
	enabled, err := svc.keyValueStore.Get(store.VideoContentEnabledKey)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get video content enabled: %w", err)
	}
	// If we are not in the correct hour range for video content, do nothing.
	timeRange, err := svc.keyValueStore.Get(store.VideoContentHourRangeKey)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get video content hour range: %w", err)
	}
	hours, err := util.ParseHourRange(timeRange)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to parse hour range: %w", err)
	}
	// TODO remove forceEnabled
	const forceEnabled = true
	settings := Settings{
		Enabled:          forceEnabled || enabled == "true",
		EnabledHourStart: hours[0],
		EnabledHourEnd:   hours[1],
	}
	return settings, nil
}

func (svc Service) HasVideoWithFilename(filename string) (bool, error) {
	videos, err := svc.ListVideos()
	if err != nil {
		return false, fmt.Errorf("failed to list videos: %w", err)
	}
	for _, video := range videos {
		if video.Filename == filename {
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

type FS interface {
	fs.FS
	WriteFile(filename string, data []byte, perm fs.FileMode) error
}

func (svc Service) GetFS() FS {
	return svc.filesystem
}
