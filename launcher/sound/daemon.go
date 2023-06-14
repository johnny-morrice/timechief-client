package sound

import (
	"context"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/sound/api"
	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
	"github.com/johnny-morrice/timechief-client/launcher/sound/service"
)

type Daemon struct {
	ListenAddr       string
	PlayStartupSound bool
}

func (daemon Daemon) Run(ctx context.Context) error {
	machine := music.NewMachine()
	go machine.Run()

	svc := service.NewSoundService(machine)
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

	return http.ListenAndServe(daemon.ListenAddr, mux)
}
