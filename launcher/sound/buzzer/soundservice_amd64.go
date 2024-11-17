//go:build !arm64
// +build !arm64

package buzzer

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound/song"
)

func MakeSoundService(pin, duty int) (SoundService, error) {
	return nullSoundService{}, nil
}

type nullSoundService struct {
}

func (svc nullSoundService) StartSong(songOpts song.Options) error {
	return nil
}

func (svc nullSoundService) StopSong() error {
	return nil
}

func (svc nullSoundService) Initialise() error {
	return nil
}

func (svc nullSoundService) Finalise() error {
	return nil
}
