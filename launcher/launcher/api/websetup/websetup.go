package websetup

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/websetup"
)

type WebSetupService interface {
	WifiSetActiveNetwork(ssid, key string) error
	ListNetworks() ([]websetup.WifiNetwork, error)
	ChooseNetworkType(networkType string) error
}

type WebSetup struct {
	service WebSetupService
}

func MakeWebSetupAPI(service WebSetupService) (WebSetup, error) {
	api := WebSetup{service: service}
	return api, nil
}

func (api WebSetup) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /web-setup/wifi", api.HandleListNetworks)
	mux.HandleFunc("POST /web-setup/wifi", api.HandleSelectNetwork)
	mux.HandleFunc("POST /web-setup/network-type", api.HandleChooseNetworkType)
}

type chooseNetworkTypeRequest struct {
	NetworkType string `json:"network_type"`
}

func (req chooseNetworkTypeRequest) Validate() error {
	if req.NetworkType != "wifi" && req.NetworkType != "manual" {
		return fmt.Errorf("unsupported network type: %s", req.NetworkType)
	}
	return nil
}

func (api WebSetup) HandleChooseNetworkType(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req chooseNetworkTypeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	err = req.Validate()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = api.service.ChooseNetworkType(req.NetworkType)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api WebSetup) HandleListNetworks(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	networks, err := api.service.ListNetworks()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(networks)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

type SelectNetworkRequest struct {
	SSID string `json:"ssid"`
	Key  string `json:"key"`
}

func (req SelectNetworkRequest) Validate() error {
	if len(req.SSID) < 2 || len(req.SSID) > 32 {
		return errors.New("ssid must be between 2 and 32 chars")
	}
	if len(req.Key) < 8 || len(req.Key) > 63 {
		return errors.New("key must be between 8 and 63 chars")
	}
	return nil
}

func (api WebSetup) HandleSelectNetwork(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SelectNetworkRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	err = req.Validate()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = api.service.WifiSetActiveNetwork(req.SSID, req.Key)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
