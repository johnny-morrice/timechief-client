package videodownload

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/util"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type Daemon struct {
	tickInterval  time.Duration
	source        VideoSource
	keyValueStore KeyValueStore
	filesystem    VideoFilesystem
	opts          Options
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

type VideoFilesystem interface {
	WriteFile(fileName string, data []byte, mode fs.FileMode) error
}

type Options struct {
	ForceDownload bool
}

func NewDaemon(tickInterval time.Duration, source VideoSource, keyValueStore KeyValueStore, blobStore VideoFilesystem, opts Options) (Daemon, error) {
	if tickInterval <= 0 {
		return Daemon{}, errors.New("refreshInterval must be positive")
	}
	if source == nil {
		return Daemon{}, errors.New("source must not be nil")
	}
	if keyValueStore == nil {
		return Daemon{}, errors.New("keyValueStore must not be nil")
	}
	if blobStore == nil {
		return Daemon{}, errors.New("blobStore must not be nil")
	}

	result := Daemon{
		tickInterval:  tickInterval,
		source:        source,
		keyValueStore: keyValueStore,
		filesystem:    blobStore,
		opts:          opts,
	}
	return result, nil
}

func (d Daemon) Start(ctx *cli.Context) {
	err := d.init()
	if err != nil {
		log.Printf("error initializing daemon video download daemon: %v", err)
		return
	}
	err = d.doTick()
	if err != nil {
		log.Printf("video download daemon tick failed: %v", err)
	}
	ticker := time.NewTicker(d.tickInterval)
	defer ticker.Stop()
	for range ticker.C {
		err = d.doTick()
		if err != nil {
			log.Printf("video download daemon tick failed: %v", err)
		}
	}
}

const defaultLastVideoDescriptor = "{}"
const defaultContentHourRange = "21-04"
const defaultContentFrequency = time.Hour * 17
const defaultContentEnabled = "false"
const defaultContentLastUpdate = "2006-01-02T15:04:05Z07:00"

func (d Daemon) init() error {
	defaultVideoViewed := time.Now().Format(time.RFC3339)
	defaults := map[string]string{
		store.VideoContentEnabledKey:    defaultContentEnabled,
		store.VideoContentHourRangeKey:  defaultContentHourRange,
		store.VideoContentLastUpdateKey: defaultContentLastUpdate,
		store.VideoContentFrequencyKey:  fmt.Sprint(defaultContentFrequency),
		store.VideoContentLastViewedKey: defaultVideoViewed,
		store.VideoDescriptorKey:        defaultLastVideoDescriptor,
	}
	for key, value := range defaults {
		err := d.initKey(key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func (d Daemon) initKey(key, value string) error {
	_, err := d.keyValueStore.Get(key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = d.keyValueStore.Set(key, value)
			if err != nil {
				return fmt.Errorf("failed to set default video content key %s: %w", key, err)
			}
			return nil
		}

		return fmt.Errorf("failed to get default video content key %s: %w", key, err)
	}
	return nil
}

func (d Daemon) doTick() error {
	isReady, err := d.shouldUpdateVideoContent()
	if err != nil {
		return fmt.Errorf("failed to check if video content is ready: %w", err)
	}
	if !isReady {
		return nil
	}
	err = d.downloadVideoContent()
	if err != nil {
		return fmt.Errorf("failed to download video content: %w", err)
	}
	err = d.keyValueStore.Set(store.VideoContentLastUpdateKey, time.Now().Format(time.RFC3339))
	if err != nil {
		return fmt.Errorf("failed to update video content last update: %w", err)
	}
	return nil
}

func (d Daemon) downloadVideoContent() error {
	// TODO we need to validate the video descriptor.
	video, err := d.source.GetVideo()
	if err != nil {
		return fmt.Errorf("failed to get video: %w", err)
	}
	lastVideoText, err := d.keyValueStore.Get(store.VideoDescriptorKey)
	if err != nil {
		return fmt.Errorf("failed to get last video UUID: %w", err)
	}
	lastVideo := VideoDescriptor{}
	err = json.Unmarshal([]byte(lastVideoText), &lastVideo)
	if err != nil {
		return fmt.Errorf("failed to parse stored video descriptor: %w", err)
	}
	if lastVideo.UUID == video.UUID && !d.opts.ForceDownload {
		log.Println("video UUID is up to date")
		return nil
	}
	log.Printf("downloading video %s %s", video.UUID, video.URL)
	data, err := downloadURLData(video.URL)
	if err != nil {
		return fmt.Errorf("failed to download video content: %w", err)
	}
	log.Printf("downloaded video %s %s", video.UUID, video.URL)
	err = d.filesystem.WriteFile(video.Filename, data, 0644)
	if err != nil {
		return fmt.Errorf("failed to store video content: %w", err)
	}
	videoDescriptorText, err := json.Marshal(video)
	if err != nil {
		return fmt.Errorf("failed to marshal video descriptor: %w", err)
	}
	err = d.keyValueStore.Set(store.VideoDescriptorKey, string(videoDescriptorText))
	if err != nil {
		return fmt.Errorf("failed to store video descriptor: %w", err)
	}
	return nil
}

func downloadURLData(url string) ([]byte, error) {
	const timeout = time.Minute * 10
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create video content request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to download video content: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download video content: status code %d", resp.StatusCode)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read video content: %w", err)
	}
	return data, nil
}

func (d Daemon) shouldUpdateVideoContent() (bool, error) {
	if d.opts.ForceDownload {
		return true, nil
	}

	// If video content is not enabled, do nothing.
	enabled, err := d.keyValueStore.Get(store.VideoContentEnabledKey)
	if err != nil {
		return false, fmt.Errorf("failed to get video content enabled: %w", err)
	}
	if enabled != "true" {
		log.Println("video content is not enabled")
		return false, nil
	}
	// If we are not in the correct hour range for video content, do nothing.
	timeRange, err := d.keyValueStore.Get(store.VideoContentHourRangeKey)
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
	frequencyStr, err := d.keyValueStore.Get(store.VideoContentFrequencyKey)
	if err != nil {
		return false, fmt.Errorf("failed to get video content frequency: %w", err)
	}
	frequency, err := time.ParseDuration(frequencyStr)
	if err != nil {
		return false, fmt.Errorf("failed to parse video content frequency: %w", err)
	}
	lastUpdateStr, err := d.keyValueStore.Get(store.VideoContentLastUpdateKey)
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
