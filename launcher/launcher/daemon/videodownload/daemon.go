package videodownload

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/util"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type Daemon struct {
	tickInterval  time.Duration
	client        VideoDownloadClient
	keyValueStore KeyValueStore
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

func NewDaemon(tickInterval time.Duration, client VideoDownloadClient, keyValueStore KeyValueStore) (Daemon, error) {
	if tickInterval <= 0 {
		return Daemon{}, errors.New("refreshInterval must be positive")
	}
	if client == nil {
		return Daemon{}, errors.New("client must not be nil")
	}
	if keyValueStore == nil {
		return Daemon{}, errors.New("keyValueStore must not be nil")
	}

	result := Daemon{
		tickInterval:  tickInterval,
		client:        client,
		keyValueStore: keyValueStore,
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

const defaultContentHourRange = "21-04"
const defaultContentFrequency = time.Hour * 17
const defaultContentEnabled = "false"
const defaultContentLastUpdate = "2006-01-02T15:04:05Z07:00"
const defaultVideoViewed = "2006-01-02T15:04:05Z07:00"

func (d Daemon) init() error {
	defaults := map[string]string{
		store.VideoContentEnabledKey:    defaultContentEnabled,
		store.VideoContentHourRangeKey:  defaultContentHourRange,
		store.VideoContentLastUpdateKey: defaultContentLastUpdate,
		store.VideoContentFrequencyKey:  fmt.Sprint(defaultContentFrequency),
		store.VideoContentLastViewedKey: defaultVideoViewed,
	}
	for key, value := range defaults {
		err := d.initKey(key, value)
		if err != nil {
			return err
		}
	}
	return nil
}

func (d Daemon) initKey(key string, value string) error {
	_, err := d.keyValueStore.Get(key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = d.keyValueStore.Set(key, value)
			if err != nil {
				return fmt.Errorf("failed to set default video content key %s: %w", key, err)
			}
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
	panic("not implemented")
}

func (d Daemon) shouldUpdateVideoContent() (bool, error) {
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
