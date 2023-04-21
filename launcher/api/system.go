package api

import (
	"encoding/json"
	"log"
	"net/http"
)

type System struct {
	Service SystemService
}

func (api System) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/system/reboot", api.HandleReboot)
	mux.HandleFunc("/api/system/shutdown", api.HandleShutdown)
}

type SystemService interface {
	Reboot() error
	Shutdown() error
}

func (api System) HandleReboot(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.Reboot()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to reboot: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleShutdown(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.Shutdown()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to shutdown: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, obj interface{}) {
	enc := json.NewEncoder(w)
	err := enc.Encode(obj)
	if err != nil {
		log.Printf("Failed to encode JSON to HTTP writer: %v", err)
	}
}
