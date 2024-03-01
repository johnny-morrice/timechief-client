package videodownload

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
	"github.com/urfave/cli/v2"
)

type Daemon struct {
	tickInterval time.Duration
	source       video.VideoSource
	videoService VideoService
	opts         Options
}

type VideoService interface {
	ReadyForUpdate() (bool, error)
	CheckSHA256(filename string, sha256 []byte) error
	Download(video video.VideoDescriptor) error
	Initialise() error
}

type Options struct {
	ForceDownload bool
}

func MakeDaemon(tickInterval time.Duration, source video.VideoSource, videoService VideoService, opts Options) (Daemon, error) {
	if tickInterval <= 0 {
		return Daemon{}, errors.New("refreshInterval must be positive")
	}
	if source == nil {
		return Daemon{}, errors.New("source must not be nil")
	}
	if videoService == nil {
		return Daemon{}, errors.New("videoService must not be nil")
	}

	result := Daemon{
		tickInterval: tickInterval,
		source:       source,
		videoService: videoService,
		opts:         opts,
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

func (d Daemon) init() error {
	return d.videoService.Initialise()
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
	return nil
}

func (d Daemon) downloadVideoContent() error {
	// TODO we need to validate the video descriptor.
	video, err := d.source.GetVideo()
	if err != nil {
		return fmt.Errorf("failed to get video: %w", err)
	}
	return d.videoService.Download(video)
}

func (d Daemon) shouldUpdateVideoContent() (bool, error) {
	if d.opts.ForceDownload {
		return true, nil
	}

	return d.videoService.ReadyForUpdate()
}
