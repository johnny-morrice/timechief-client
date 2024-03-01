package picturedownload

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
	"github.com/urfave/cli/v2"
)

type Daemon struct {
	tickInterval   time.Duration
	source         picture.PictureSource
	pictureService PictureService
}

type PictureService interface {
	CheckSHA256(filename string, sha256 []byte) error
	Download(picture picture.PictureDescriptor) error
	Initialise() error
}

func MakeDaemon(tickInterval time.Duration, source picture.PictureSource, pictureService PictureService) (Daemon, error) {
	if tickInterval <= 0 {
		return Daemon{}, errors.New("refreshInterval must be positive")
	}
	if source == nil {
		return Daemon{}, errors.New("source must not be nil")
	}
	if pictureService == nil {
		return Daemon{}, errors.New("pictureService must not be nil")
	}

	result := Daemon{
		tickInterval:   tickInterval,
		source:         source,
		pictureService: pictureService,
	}
	return result, nil
}

func (d Daemon) Start(ctx *cli.Context) {
	err := d.init()
	if err != nil {
		log.Printf("error initializing daemon picture download daemon: %v", err)
		return
	}
	err = d.doTick()
	if err != nil {
		log.Printf("picture download daemon tick failed: %v", err)
	}
	ticker := time.NewTicker(d.tickInterval)
	defer ticker.Stop()
	for range ticker.C {
		err = d.doTick()
		if err != nil {
			log.Printf("picture download daemon tick failed: %v", err)
		}
	}
}

func (d Daemon) init() error {
	return d.pictureService.Initialise()
}

func (d Daemon) doTick() error {
	err := d.downloadPicture()
	if err != nil {
		return fmt.Errorf("failed to download picture content: %w", err)
	}
	return nil
}

func (d Daemon) downloadPicture() error {
	// TODO we need to validate the picture descriptor.
	picture, err := d.source.GetPicture()
	if err != nil {
		return fmt.Errorf("failed to get picture: %w", err)
	}
	return d.pictureService.Download(picture)
}
