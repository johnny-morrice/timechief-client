package video

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/videodownload"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Service struct {
	keyValueStore KeyValueStore
	filesystem    fs.FS
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func MakeService(keyValueStore KeyValueStore, filesystem fs.FS) (Service, error) {
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

func (svc Service) ListVideos() ([]VideoMetadata, error) {
	videoText, err := svc.keyValueStore.Get(store.VideoDescriptorKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get video descriptor: %w", err)
	}
	video := videodownload.VideoDescriptor{}
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
	return false, nil
}

func (svc Service) GetFS() fs.FS {
	return svc.filesystem
}
