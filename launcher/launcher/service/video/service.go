package video

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/util"
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
		return Service{}, errors.New("blobStore must not be nil")
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

const defaultLastVideoDescriptor = "{}"
const defaultContentHourRange = "21-04"
const defaultContentFrequency = time.Hour * 17
const defaultContentLastUpdate = "2006-01-02T15:04:05Z07:00"

func (svc Service) Initialise() error {
	defaultVideoViewed := time.Now().Format(time.RFC3339)
	defaults := map[string]string{
		store.VideoContentHourRangeKey:  defaultContentHourRange,
		store.VideoContentLastUpdateKey: defaultContentLastUpdate,
		store.VideoContentFrequencyKey:  fmt.Sprint(defaultContentFrequency),
		store.VideoContentLastViewedKey: defaultVideoViewed,
		store.VideoDescriptorKey:        defaultLastVideoDescriptor,
	}
	for key, value := range defaults {
		err := svc.initKey(key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func (svc Service) initKey(key, value string) error {
	_, err := svc.keyValueStore.Get(key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = svc.keyValueStore.Set(key, value)
			if err != nil {
				return fmt.Errorf("failed to set default video content key %s: %w", key, err)
			}
			return nil
		}

		return fmt.Errorf("failed to get default video content key %s: %w", key, err)
	}
	return nil
}

func (svc Service) isOptedIn() (bool, error) {
	data, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return false, fmt.Errorf("failed to get device data: %w", err)
	}
	return data.DeviceProfile.Value.Features.SpookyCampaign, nil
}

func (svc Service) ReadyForUpdate() (bool, error) {
	// If video content is not enabled, do nothing.
	optedIn, err := svc.isOptedIn()
	if !optedIn {
		log.Println("video content is not enabled")
		return false, nil
	}
	// If we are not in the correct hour range for video content, do nothing.
	timeRange, err := svc.keyValueStore.Get(store.VideoContentHourRangeKey)
	if err != nil {
		return false, fmt.Errorf("failed to get video content hour range: %w", err)
	}
	inRange, err := util.IsInHourRange(timeRange)
	if err != nil {
		return false, fmt.Errorf("failed to check if in video content hour range: %w", err)
	}
	if !inRange {
		log.Println("video content is not in permitted range")
		return false, nil
	}
	// If we have downloaded video content within the frequency, do nothing.
	frequencyStr, err := svc.keyValueStore.Get(store.VideoContentFrequencyKey)
	if err != nil {
		return false, fmt.Errorf("failed to get video content frequency: %w", err)
	}
	frequency, err := time.ParseDuration(frequencyStr)
	if err != nil {
		return false, fmt.Errorf("failed to parse video content frequency: %w", err)
	}
	lastUpdateStr, err := svc.keyValueStore.Get(store.VideoContentLastUpdateKey)
	if err != nil {
		return false, fmt.Errorf("failed to get video content last update: %w", err)
	}
	lastUpdate, err := time.Parse(time.RFC3339, lastUpdateStr)
	if err != nil {
		return false, fmt.Errorf("failed to parse video content last update: %w", err)
	}
	if time.Since(lastUpdate) < frequency {
		log.Println("video content is up to date")
		return false, nil
	}
	return true, nil
}

type VideoMetadata struct {
	UUID            string `json:"uuid"`
	Filename        string `json:"filename"`
	DurationSeconds int    `json:"duration"`
}

func (svc Service) CheckSHA256(filename string, expected []byte) error {
	return svc.filesystem.CheckSHA256(filename, expected)
}

func (svc Service) List() ([]VideoMetadata, error) {
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

func (svc Service) GetPreferences() (Settings, error) {
	// If video content is not enabled, do nothing.
	descriptorText, err := svc.keyValueStore.Get(store.VideoDescriptorKey)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get video descriptor: %w", err)
	}
	if descriptorText == "" {
		return Settings{}, nil
	}
	descriptor := VideoDescriptor{}
	err = json.Unmarshal([]byte(descriptorText), &descriptor)
	if err != nil {
		return Settings{}, fmt.Errorf("failed to unmarshal video descriptor: %w", err)
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
	data, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return Settings{}, fmt.Errorf("failed to get device data: %w", err)
	}
	enabled := data.DeviceProfile.Value.Features.SpookyCampaign
	enabled = enabled && data.SpookyCampaign.Value.VideoUuid == descriptor.UUID
	settings := Settings{
		Enabled:          enabled,
		EnabledHourStart: hours[0],
		EnabledHourEnd:   hours[1],
	}
	return settings, nil
}

func (svc Service) Exists(filename string) (bool, error) {
	videos, err := svc.List()
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

func (svc Service) GetFS() media.FS {
	return svc.filesystem
}

func (d Service) Download(video VideoDescriptor) error {
	// TODO we need to validate the video descriptor.
	lastVideoText, err := d.keyValueStore.Get(store.VideoDescriptorKey)
	if err != nil {
		return fmt.Errorf("failed to get last video UUID: %w", err)
	}
	lastVideo := VideoDescriptor{}
	err = json.Unmarshal([]byte(lastVideoText), &lastVideo)
	if err != nil {
		return fmt.Errorf("failed to parse stored video descriptor: %w", err)
	}
	if lastVideo.UUID == video.UUID {
		err := d.filesystem.CheckSHA256(video.Filename, video.SHA256)
		if err != nil {
			log.Printf("video sha check failed: %s", err.Error())
		} else {
			log.Printf("video %s is already downloaded", video.UUID)
			return nil
		}
	}
	log.Printf("downloading video %s %s", video.UUID, video.URL)
	data, err := d.downloader.Download(context.Background(), video.URL, video.SHA256)
	if err != nil {
		return fmt.Errorf("failed to download video content: %w", err)
	}
	log.Printf("downloaded video %s %s", video.UUID, video.URL)
	err = d.filesystem.WriteFile(video.Filename, data, 0644)
	if err != nil {
		return fmt.Errorf("failed to store video content: %w", err)
	}
	err = d.filesystem.CheckSHA256(video.Filename, video.SHA256)
	if err != nil {
		return fmt.Errorf("failed to validate video content: %w", err)
	}
	videoDescriptorText, err := json.Marshal(video)
	if err != nil {
		return fmt.Errorf("failed to marshal video descriptor: %w", err)
	}
	err = d.keyValueStore.Set(store.VideoDescriptorKey, string(videoDescriptorText))
	if err != nil {
		return fmt.Errorf("failed to store video descriptor: %w", err)
	}
	err = d.keyValueStore.Set(store.VideoContentLastUpdateKey, time.Now().Format(time.RFC3339))
	if err != nil {
		return fmt.Errorf("failed to update video content last update: %w", err)
	}
	return nil
}
