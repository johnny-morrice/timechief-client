package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type API struct {
	Service APIService
}

func (api *API) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/device", api.HandleGetDeviceData)
	mux.HandleFunc("/api/config", api.HandleGetConfig)
	mux.HandleFunc("/api/target", api.HandleGetTarget)
	mux.HandleFunc("/api/target/recover", api.HandleRecoverTargetStatus)
	mux.HandleFunc("/api/pairing", api.HandlePairing)
	mux.HandleFunc("/api/system/reboot", api.HandleReboot)
	mux.HandleFunc("/api/system/shutdown", api.HandleShutdown)
}

type APIService interface {
	GetDeviceData() (service.DeviceData, error)
	GetTarget() (service.LaunchTarget, error)
	RecoverTarget() (service.TargetStatus, error)
	GetConfig() (store.Config, error)
	PairDevice() error
	GetPairingStatus() (service.PairingStatus, error)
	Reboot() error
	Shutdown() error
}

func (api API) HandleGetTarget(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	target, err := api.Service.GetTarget()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to get target: %v", err)
		return
	}
	writeJSON(w, target)
}

func (api API) HandleGetConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	config, err := api.Service.GetConfig()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to get config: %v", err)
		return
	}
	writeJSON(w, config)
}

func (api API) HandleGetDeviceData(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	data, err := api.Service.GetDeviceData()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to get device data: %v", err)
		return
	}
	writeJSON(w, data)
}

func (api API) HandlePairing(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		api.HandleGetPairing(w, r)
	case "POST":
		api.HandlePostPairing(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (api API) HandlePostPairing(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.PairDevice()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to create pairing: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api API) HandleGetPairing(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	status, err := api.Service.GetPairingStatus()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to get target: %v", err)
		return
	}
	writeJSON(w, status)
}

func (api API) HandleRecoverTargetStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	recoveryState, err := api.Service.RecoverTarget()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to recover target: %v", err)
		return
	}
	writeJSON(w, recoveryState)
}

func (api API) HandleReboot(w http.ResponseWriter, r *http.Request) {
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

func (api API) HandleShutdown(w http.ResponseWriter, r *http.Request) {
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
