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
	mux.HandleFunc("/api/system/wifi/connect", api.HandleWifiConnect)
	mux.HandleFunc("/api/system/wifi/hotspot", api.HandleWifiHotspot)
	mux.HandleFunc("/api/system/wifi/load-interfaces", api.HandleWifiLoadInterfaces)
	mux.HandleFunc("/api/system/wifi/scan", api.HandleWifiScan)
}

type SystemService interface {
	Reboot() error
	Shutdown() error
	WifiConnect() error
	WifiHotspot() error
	WifiLoadInterfaces() error
	WifiScan() error
}

func (api System) HandleWifiConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.WifiConnect()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Failed to handle wifi connect: %v", err)
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
		log.Printf("Failed to handle wifi hotspot: %v", err)
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
		log.Printf("Failed to handle wifi load interfaces: %v", err)
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
		log.Printf("Failed to handle wifi scan: %v", err)
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
