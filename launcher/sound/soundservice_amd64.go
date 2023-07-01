//go:build !arm64
// +build !arm64

package sound

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound/service"
)

func initialiseSoundService(pin int) (soundService, error) {
	return nullSoundService{}, nil
}

type nullSoundService struct {
}

func (svc nullSoundService) StartSong(songOpts service.SongOptions) error {
	return nil
}

func (svc nullSoundService) StopSong() error {
	return nil
}

func finaliseSoundService() {

}
