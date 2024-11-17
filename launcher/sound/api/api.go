package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/sound/song"
)

type SoundAPI struct {
	svc MusicService
}

func NewSoundAPI(svc MusicService) SoundAPI {
	return SoundAPI{
		svc: svc,
	}
}

type MusicService interface {
	StartSong(songOpts song.Options) error
	StopSong() error
}

func (api SoundAPI) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/sound/play", api.handlePlaySong)
	mux.HandleFunc("/api/sound/stop", api.handleStopSong)
}

type SongRequest struct {
	SongName string `json:"song_name"`
	Loop     bool   `json:"loop"`
}

func (api SoundAPI) handlePlaySong(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		log.Println("invalid method")
		rw.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	param := SongRequest{}
	err := json.NewDecoder(req.Body).Decode(&param)
	if err != nil {
		log.Printf("error decoding song request: %v", err)
		rw.WriteHeader(http.StatusBadRequest)
		return
	}
	err = api.svc.StartSong(song.Options{
		SongName: param.SongName,
		Loop:     param.Loop,
	})
	if err != nil {
		log.Printf("error starting song: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	rw.WriteHeader(http.StatusNoContent)
}

func (api SoundAPI) handleStopSong(rw http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		rw.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	err := api.svc.StopSong()
	if err != nil {
		log.Printf("error stopping song: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}
	rw.WriteHeader(http.StatusNoContent)
}
