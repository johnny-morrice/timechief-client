package sound

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/sound/api"
	"github.com/johnny-morrice/timechief-client/launcher/sound/buzzer"
	"github.com/johnny-morrice/timechief-client/launcher/sound/pipewire"
	"github.com/johnny-morrice/timechief-client/launcher/sound/song"
)

type Daemon struct {
	cfg Config
	svc soundService
}

type Config struct {
	ListenAddr       string
	SoundProvider    string
	PlayStartupSound bool
	PassiveBuzzer    PassiveBuzzerConfig
	Pipewire         PipewireConfig
}

func (cfg Config) Validate() error {
	switch cfg.SoundProvider {
	case "buzzer":
	case "pipewire":
	default:
		return fmt.Errorf("unknown sound provider: %s", cfg.SoundProvider)
	}
	return nil
}

type PassiveBuzzerConfig struct {
	PWMPin int
	Duty   int
}

type PipewireConfig struct {
	DoFirstTimeSetup bool
	Volume           float64
}

func MakeDaemon(cfg Config) (Daemon, error) {
	svc, err := makeSoundService(cfg)
	if err != nil {
		return Daemon{}, err
	}
	daemon := Daemon{
		svc: svc,
		cfg: cfg,
	}
	return daemon, nil
}

func makeSoundService(cfg Config) (soundService, error) {
	err := cfg.Validate()
	if err != nil {
		return nil, err
	}

	switch cfg.SoundProvider {
	case "buzzer":
		return buzzer.MakeSoundService(cfg.PassiveBuzzer.PWMPin, cfg.PassiveBuzzer.Duty)
	case "pipewire":
		return pipewire.MakeSoundService(cfg.Pipewire.DoFirstTimeSetup, cfg.Pipewire.Volume)
	}

	return nil, fmt.Errorf("failed to create sound service")
}

// func (daemon Daemon) MakeSoundDaemon(cfg)

func (daemon Daemon) Run(ctx context.Context) error {
	// svc, err := initialiseSoundService(daemon.PWMPin, daemon.Duty)
	// if err != nil {
	// 	return err
	// }
	// defer finaliseSoundService()
	err := daemon.svc.Initialise()
	if err != nil {
		return fmt.Errorf("failed to initialise sound daemon")
	}

	defer func() {
		err := daemon.svc.Finalise()
		if err != nil {
			log.Printf("failed to finalise daemon sound service: %s", err)
		}
	}()

	api := api.NewSoundAPI(daemon.svc)

	mux := http.NewServeMux()
	api.AddRoutes(mux)

	if daemon.cfg.PlayStartupSound {
		err := daemon.svc.StartSong(song.Options{
			SongName: "startup",
			Loop:     false,
		})
		if err != nil {
			log.Printf("error playing startup sound: %v", err)
		}
	}

	log.Printf("listening on %v", daemon.cfg.ListenAddr)
	return http.ListenAndServe(daemon.cfg.ListenAddr, mux)
}

type soundService interface {
	Initialise() error
	StartSong(songOpts song.Options) error
	StopSong() error
	Finalise() error
}
