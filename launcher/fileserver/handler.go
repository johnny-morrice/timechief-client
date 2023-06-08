package fileserver

import (
	"embed"
	"net/http"
)

//go:embed static
var staticFiles embed.FS

func embeddedFileHandler() http.Handler {
	return http.FileServer(http.FS(staticFiles))
}

type StaticFileHandler struct {
}

func (handler StaticFileHandler) AddRoutes(mux *http.ServeMux) {
	mux.Handle("/www", http.StripPrefix("/www/", embeddedFileHandler()))
}
