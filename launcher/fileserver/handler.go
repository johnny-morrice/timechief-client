package fileserver

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
)

//go:embed static
var embeddedFilesystem embed.FS
var staticFiles fs.FS

func init() {
	var err error
	staticFiles, err = fs.Sub(embeddedFilesystem, "static")
	if err != nil {
		panic("failed to get 'static' filesystem")
	}
	log.Println("set up static filesystem")
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
