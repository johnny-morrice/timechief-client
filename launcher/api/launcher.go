package api

import (
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/service/launcher"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type LauncherService interface {
	GetConfig() (store.Config, error)
	GetTarget() (service.LaunchTarget, error)
	RecoverTarget() (launcher.TargetStatus, error)
}

type Launcher struct {
	Service LauncherService
}

func (api Launcher) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/launcher/config", api.HandleGetConfig)
	mux.HandleFunc("/api/launcher/target", api.HandleGetTarget)
	mux.HandleFunc("/api/launcher/target/recover", api.HandleRecoverTargetStatus)
}

func (api Launcher) HandleGetConfig(w http.ResponseWriter, r *http.Request) {
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

func (api Launcher) HandleGetTarget(w http.ResponseWriter, r *http.Request) {
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

func (api Launcher) HandleRecoverTargetStatus(w http.ResponseWriter, r *http.Request) {
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
