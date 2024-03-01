package media

import (
	"errors"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
)

type MediaService interface {
	Exists(fileName string) (bool, error)
	GetFS() media.FS
}

type Media struct {
	videoService   MediaService
	pictureService MediaService
}

func NewMediaAPI(videoService, pictureService MediaService) (Media, error) {
	if videoService == nil {
		return Media{}, errors.New("videoService must not be nil")
	}
	if pictureService == nil {
		return Media{}, errors.New("pictureService must not be nil")
	}
	api := Media{
		videoService:   videoService,
		pictureService: pictureService,
	}
	return api, nil
}

func (api Media) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /media/video/{fileName}", api.HandleGetVideo)
	mux.HandleFunc("GET /media/picture/{fileName}", api.HandleGetPicture)
}

func (api Media) HandleGetPicture(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileName := r.PathValue("fileName")
	if fileName == "" {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	hasPicture, err := api.pictureService.Exists(fileName)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !hasPicture {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	pictureFS := api.pictureService.GetFS()
	http.ServeFileFS(w, r, pictureFS, fileName)
}

func (api Media) HandleGetVideo(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileName := r.PathValue("fileName")
	if fileName == "" {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	hasVideo, err := api.videoService.Exists(fileName)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !hasVideo {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	videoFS := api.videoService.GetFS()
	http.ServeFileFS(w, r, videoFS, fileName)
}
