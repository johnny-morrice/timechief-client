package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/launcher"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type LauncherService interface {
	GetConfig() (store.Config, error)
	GetTarget() (service.LaunchTarget, error)
	RecoverTarget() (launcher.TargetStatus, error)
	SetSetupState(state string) error
	OnLogin() error
	RegenerateUserAPIKey() (launcher.LauncherAPIKey, error)
	GetTargetEnv() (launcher.TargetEnv, error)
}

type Launcher struct {
	Service LauncherService
}

func (api Launcher) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/launcher/config", api.HandleGetConfig)
	mux.HandleFunc("/api/launcher/target", api.HandleGetTarget)
	mux.HandleFunc("/api/launcher/target/env", api.HandleGetTargetEnv)
	mux.HandleFunc("/api/launcher/target/recover", api.HandleRecoverTargetStatus)
	mux.HandleFunc("/api/launcher/setup", api.HandlePostSetup)
	mux.HandleFunc("/api/launcher/on-login", api.HandlePostOnLoginCallback)
	mux.HandleFunc("/api/launcher/api-key/user", api.HandlePostRegenerateUserAPIKey)
}

type setupRequest struct {
	State string
}

func (api Launcher) HandleGetTargetEnv(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	env, err := api.Service.GetTargetEnv()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to get target env: %v", err)
		return
	}
	writeJSON(w, env)
}

func (api Launcher) HandlePostRegenerateUserAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	key, err := api.Service.RegenerateUserAPIKey()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to regenerate API key: %v", err)
		return
	}
	writeJSON(w, key)
}

func (api Launcher) HandlePostSetup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req setupRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	err = api.Service.SetSetupState(req.State)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to set setup state: %v", err)
		return
	}
}

func (api Launcher) HandleGetConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	config, err := api.Service.GetConfig()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to get config: %v", err)
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
		log.Printf("failed to get target: %v", err)
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
		log.Printf("failed to recover target: %v", err)
		return
	}
	writeJSON(w, recoveryState)
}

func (api Launcher) HandlePostOnLoginCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	err := api.Service.OnLogin()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("failed to run on login callback: %v", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
