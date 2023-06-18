package fileserver

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed static
var embeddedFilesystem embed.FS
var staticFiles fs.FS

func InitialiseFS() error {
	var err error
	staticFiles, err = fs.Sub(embeddedFilesystem, "static")
	if err != nil {
		return fmt.Errorf("failed to get 'static' filesystem: %w", err)
	}
	log.Println("set up static filesystem")
	return nil
}

func embeddedFileHandler() http.Handler {
	return http.FileServer(http.FS(staticFiles))
}

type StaticFileHandler struct {
	fileHandler http.Handler
}

func NewStaticFileHandler() StaticFileHandler {
	return StaticFileHandler{embeddedFileHandler()}
}

func (handler StaticFileHandler) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", handler.handleServeFiles)
}

func (handler StaticFileHandler) handleServeFiles(w http.ResponseWriter, r *http.Request) {
	handler.fileHandler.ServeHTTP(w, r)
}
