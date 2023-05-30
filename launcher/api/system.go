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
	mux.HandleFunc("/api/system/wifi/state", api.HandleWifiState)
	mux.HandleFunc("/api/system/wifi/connect", api.HandleWifiConnect)
	mux.HandleFunc("/api/system/wifi/hotspot", api.HandleWifiHotspot)
	mux.HandleFunc("/api/system/wifi/load-interfaces", api.HandleWifiLoadInterfaces)
	mux.HandleFunc("/api/system/wifi/network", api.HandleWifiSetActiveNetwork)
	mux.HandleFunc("/api/system/wifi/scan", api.HandleWifiScan)
}

type SystemService interface {
	Reboot() error
	Shutdown() error
	WifiConnect() error
	WifiHotspot() error
	WifiLoadInterfaces() error
	WifiScan() error
	WifiSetActiveNetwork(ssid, key string) error
	WifiSetSelectedReadiness(ready bool) error
}

type WifiActivationRequest struct {
	SSID string
	Key  string
}

func (api System) HandleWifiSetActiveNetwork(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	req := WifiActivationRequest{}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		log.Printf("failed to decode wifi activation request: %v", err)
		return
	}
	err = api.Service.WifiSetActiveNetwork(req.SSID, req.Key)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi set active network: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type WifiStateRequest struct {
	Ready bool
}

func (api System) HandleWifiState(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	req := WifiStateRequest{}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		log.Printf("failed to decode wifi state request: %v", err)
		return
	}
	err = api.Service.WifiSetSelectedReadiness(req.Ready)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi active network readiness: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleWifiConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.WifiConnect()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi connect: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleWifiHotspot(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.WifiHotspot()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi hotspot: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleWifiLoadInterfaces(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.WifiLoadInterfaces()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi load interfaces: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleWifiScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.WifiScan()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to handle wifi scan: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (api System) HandleReboot(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.Reboot()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to reboot: %v", err)
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
		log.Printf("failed to shutdown: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, obj interface{}) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	err := enc.Encode(obj)
	if err != nil {
		log.Printf("failed to encode JSON to HTTP writer: %v", err)
	}
}
