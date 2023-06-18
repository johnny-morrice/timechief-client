package api

import (
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/data"
)

type DataService interface {
	GetDeviceData() (data.DeviceData, error)
	PairDevice() error
	GetPairingStatus() (data.PairingStatus, error)
}

type Data struct {
	Service DataService
}

func (api Data) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/data/device", api.HandleGetDeviceData)
	mux.HandleFunc("/api/data/pairing", api.HandlePairing)
}

func (api Data) HandleGetDeviceData(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	data, err := api.Service.GetDeviceData()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to get device data: %v", err)
		return
	}
	writeJSON(w, data)
}

func (api Data) HandlePairing(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		api.HandleGetPairing(w, r)
	case "POST":
		api.HandlePostPairing(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (api Data) HandlePostPairing(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.PairDevice()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to create pairing: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api Data) HandleGetPairing(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	status, err := api.Service.GetPairingStatus()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to get target: %v", err)
		return
	}
	writeJSON(w, status)
}
