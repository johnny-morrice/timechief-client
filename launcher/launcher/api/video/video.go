package video

import (
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
)

type VideoService interface {
	ListVideos() ([]video.VideoMetadata, error)
	HasVideoWithFilename(fileName string) (bool, error)
	GetFS() fs.FS
}

type Video struct {
	service VideoService
}

func NewVideoAPI(service VideoService) (Video, error) {
	if service == nil {
		return Video{}, errors.New("service must not be nil")
	}
	api := Video{service: service}
	return api, nil
}

func (api Video) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/video/list", api.HandleListVideos)
	mux.HandleFunc("/api/video/{fileName}", api.HandleGetVideo)
}

func (api Video) HandleListVideos(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	videos, err := api.service.ListVideos()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	videoJSON, err := json.Marshal(videos)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(videoJSON)
}

func (api Video) HandleGetVideo(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileName := r.URL.Query().Get("fileName")
	if fileName == "" {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	hasVideo, err := api.service.HasVideoWithFilename(fileName)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !hasVideo {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	videoFS := api.service.GetFS()
	http.ServeFileFS(w, r, videoFS, fileName)
}
