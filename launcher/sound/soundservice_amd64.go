//go:build !arm64
// +build !arm64

package sound

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
	"github.com/johnny-morrice/timechief-client/launcher/sound/rpio"
	"github.com/johnny-morrice/timechief-client/launcher/sound/service"
)

func initialiseSoundService(pin int) (soundService, error) {
	return nullSoundService{}, nil
}

func finaliseSoundService() {

}
