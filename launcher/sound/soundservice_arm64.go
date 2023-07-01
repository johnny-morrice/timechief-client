//go:build arm64
// +build arm64

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
	err := rpio.InitialiseRPIO()
	if err != nil {
		return service.SoundService{}, err
	}

	tg := rpio.NewPWMToneGenerator(pin)

	machine := music.NewMachine(tg)
	go machine.Run()

	handleSignals(machine)

	return service.NewSoundService(machine)
}

func finaliseSoundService() {
	err := rpio.ShutdownRPIO()
	if err != nil {
		log.Printf("error shutting down RPIO: %v", err)
	}
}

// When we receive signterm we need to stop the machine.
// This is because the machine uses raspberry pi PWM hardware and we need to shutdown the channel.
// Otherwise sound might still come out.
func handleSignals(machine *music.Machine) {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM)
	go func() {
		for {
			sig := <-signals
			if sig == syscall.SIGTERM {
				err := machine.StopSong()
				if err != nil {
					log.Printf("error stopping machine: %v", err)
				}
				err = rpio.ShutdownRPIO()
				if err != nil {
					log.Printf("error shutting down rpio: %v", err)
				}

			}
		}
	}()
}
