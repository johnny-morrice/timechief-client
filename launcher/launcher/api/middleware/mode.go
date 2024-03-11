package middleware

import (
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

func MakeWebSetupModeMiddleware(kvStore KeyValueStore, next http.Handler) (http.Handler, error) {
	return makeModeMiddleware(WebSetupAuthMode, kvStore, next)
}

func MakeAPIEnabledModeMiddleware(kvStore KeyValueStore, next http.Handler) (http.Handler, error) {
	return makeModeMiddleware(APIAuthMode, kvStore, next)
}

type modeMiddleware struct {
	expectedMode string
	kvStore      KeyValueStore
	next         http.Handler
}

func makeModeMiddleware(expectedMode string, kvStore KeyValueStore, next http.Handler) (http.Handler, error) {
	if kvStore == nil {
		return nil, errors.New("kvStore cannot be nil")
	}
	if next == nil {
		return nil, errors.New("next cannot be nil")
	}
	mid := modeMiddleware{
		expectedMode: expectedMode,
		kvStore:      kvStore,
		next:         next,
	}
	return mid, nil
}

func (mid modeMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	authMode := r.Context().Value(AuthMethodContextKey).(string)
	deviceMode, err := mid.getDeviceMode()
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		log.Printf("error getting device mode: %v", err)
		return
	}
	if authMode != deviceMode && authMode != AppAuthMode {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		log.Printf("auth mode %s does not match device mode %s", authMode, deviceMode)
		return
	}
	mid.next.ServeHTTP(w, r)
}

func (mid modeMiddleware) getDeviceMode() (string, error) {
	setupState, err := mid.kvStore.Get("setup")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", fmt.Errorf("error getting setup state: %v", err)
	}
	if setupState == daemon.SetupFlagWaitUserSelectNetwork {
		return WebSetupAuthMode, nil
	}
	apiAccess, err := mid.kvStore.Get(store.APIAccessEnabled)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", fmt.Errorf("error getting api access: %v", err)
	}

	if apiAccess == "true" {
		return APIAuthMode, nil
	}
	return NoAuthMode, nil
}
