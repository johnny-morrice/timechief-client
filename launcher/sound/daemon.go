package sound

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/johnny-morrice/timechief-client/launcher/sound/api"
	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
	"github.com/johnny-morrice/timechief-client/launcher/sound/rpio"
	"github.com/johnny-morrice/timechief-client/launcher/sound/service"
)

type Daemon struct {
	ListenAddr       string
	PlayStartupSound bool
	PWMPin           int
}

func (daemon Daemon) Run(ctx context.Context) error {
	err := rpio.InitialiseRPIO()
	if err != nil {
		return err
	}
	defer func() {
		err := rpio.ShutdownRPIO()
		if err != nil {
			log.Printf("error shutting down RPIO: %v", err)
		}
	}()
	tg := rpio.NewPWMToneGenerator(daemon.PWMPin)

	machine := music.NewMachine(tg)
	go machine.Run()

	handleSignals(machine)

	svc, err := service.NewSoundService(machine)
	if err != nil {
		return err
	}
	api := api.NewSoundAPI(svc)

	mux := http.NewServeMux()
	api.AddRoutes(mux)

	if daemon.PlayStartupSound {
		err := svc.StartSong(service.SongOptions{
			SongName: "startup",
			Loop:     false,
		})
		if err != nil {
			log.Printf("error playing startup sound: %v", err)
		}
	}

	log.Printf("listening on %v", daemon.ListenAddr)
	return http.ListenAndServe(daemon.ListenAddr, mux)
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
