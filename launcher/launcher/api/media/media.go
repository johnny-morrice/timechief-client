package media

import (
	"errors"
	"io/fs"
	"net/http"
)

type MediaService interface {
	HasVideoWithFilename(fileName string) (bool, error)
	GetFS() fs.FS
}

type Video struct {
	service MediaService
}

func NewVideoAPI(service MediaService) (Video, error) {
	if service == nil {
		return Video{}, errors.New("service must not be nil")
	}
	api := Video{service: service}
	return api, nil
}

func (api Video) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /media/video/{fileName}", api.HandleGetVideo)
}

func (api Video) HandleGetVideo(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileName := r.PathValue("fileName")
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
