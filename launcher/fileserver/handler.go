package fileserver

import (
	"embed"
	"net/http"
)

//go:embed static
var staticFiles embed.FS

func NewStaticFileHandler() http.Handler {
	return http.FileServer(http.FS(staticFiles))
}
