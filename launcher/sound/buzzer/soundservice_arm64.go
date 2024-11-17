//go:build arm64
// +build arm64

package buzzer

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/johnny-morrice/timechief-client/launcher/sound/buzzer/music"
	"github.com/johnny-morrice/timechief-client/launcher/sound/buzzer/rpio"
	"github.com/johnny-morrice/timechief-client/launcher/sound/buzzer/service"
)

func MakeSoundService(pin, duty int) (SoundService, error) {
	err := rpio.InitialiseRPIO()
	if err != nil {
		return service.SoundService{}, err
	}

	tg := rpio.NewPWMToneGenerator(pin, duty)

	machine := music.NewMachine(tg)
	go machine.Run()

	handleSignals(machine)

	return service.NewSoundService(machine)
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
