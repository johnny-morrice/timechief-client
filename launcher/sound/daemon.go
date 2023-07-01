package sound

import (
	"context"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/sound/api"
	"github.com/johnny-morrice/timechief-client/launcher/sound/service"
)

type Daemon struct {
	ListenAddr       string
	PlayStartupSound bool
	PWMPin           int
}

func (daemon Daemon) Run(ctx context.Context) error {
	svc, err := initialiseSoundService(daemon.PWMPin)
	if err != nil {
		return err
	}
	defer finaliseSoundService()
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

type soundService interface {
	StartSong(songOpts service.SongOptions) error
	StopSong() error
}
