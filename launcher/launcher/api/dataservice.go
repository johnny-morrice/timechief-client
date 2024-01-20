package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/data"
)

type DataService interface {
	Logout() error
	SetLicenseActivationCode(code string) error
	GetDeviceData() (data.DeviceData, error)
	PairDevice() error
	GetPairingStatus() (data.PairingStatus, error)
	RefreshMyDevices() error
	SetMyDevice(uuid string) error
}

type Data struct {
	service DataService
}

func MakeDataAPI(service DataService) Data {
	return Data{service: service}
}

func (api Data) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/data/license", api.HandlePostLicenseActivationCode)
	mux.HandleFunc("/api/data/device", api.HandleGetDeviceData)
	mux.HandleFunc("/api/data/pairing", api.HandlePairing)
	mux.HandleFunc("/api/data/logout", api.HandleLogout)
	mux.HandleFunc("/api/data/mydevice", api.HandlePostMyDevice)
	mux.HandleFunc("/api/data/mydevice/refresh", api.RefreshMyDevices)

}

func (api Data) HandleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := api.service.Logout()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to logout: %v", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type LicenseActivationCodeRequest struct {
	Code string `json:"code"`
}

func (api Data) HandlePostLicenseActivationCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req LicenseActivationCodeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	err = api.service.SetLicenseActivationCode(req.Code)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to set license activation code: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api Data) RefreshMyDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.service.RefreshMyDevices()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to refresh my devices: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type DeviceUUIDRequest struct {
	UUID string `json:"uuid"`
}

func (api Data) HandlePostMyDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req DeviceUUIDRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	err = api.service.SetMyDevice(req.UUID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to set my device: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api Data) HandleGetDeviceData(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	data, err := api.service.GetDeviceData()
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
	err := api.service.PairDevice()
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
	status, err := api.service.GetPairingStatus()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to get target: %v", err)
		return
	}
	writeJSON(w, status)
}
