package auth

import (
	"encoding/json"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/api/middleware"
)

type AuthAPI struct{}

func MakeAuthAPI() (AuthAPI, error) {
	return AuthAPI{}, nil
}

func (api AuthAPI) AddRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /auth/me", api.HandleGetMe)
}

type Me struct {
	AuthMode   string `json:"auth_mode"`
	DeviceMode string `json:"device_mode"`
}

func (api AuthAPI) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	authMode := middleware.GetAuthContext(r)
	deviceMode := middleware.GetDeviceContext(r)
	me := Me{
		AuthMode:   authMode,
		DeviceMode: deviceMode,
	}
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(me)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}
