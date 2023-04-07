package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/service"
)

type API struct {
	Service APIService
}

func (api *API) AddRoutes(group *http.ServeMux) {
	group.HandleFunc("/api/device", api.HandleGetDeviceData)
	group.HandleFunc("/api/target", api.HandleGetTarget)
	group.HandleFunc("/api/target/recover", api.HandleRecoverTargetStatus)
}

type APIService interface {
	GetDeviceData() (service.DeviceData, error)
	GetTarget() (service.LaunchTarget, error)
	RecoverTarget() (service.TargetStatus, error)
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

func (api API) HandleRecoverTargetStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
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

func writeJSON(w http.ResponseWriter, obj interface{}) {
	enc := json.NewEncoder(w)
	err := enc.Encode(obj)
	if err != nil {
		log.Printf("Failed to encode JSON to HTTP writer: %v", err)
	}
}
