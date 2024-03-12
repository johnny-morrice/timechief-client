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

type modeMiddleware struct {
	expectedModes []string
	kvStore       KeyValueStore
	next          http.Handler
}

func MakeAuthModeMiddleware(kvStore KeyValueStore, next http.Handler, expectedModes ...string) (http.Handler, error) {
	if len(expectedModes) == 0 {
		return nil, errors.New("expectedModes cannot be empty")
	}
	if kvStore == nil {
		return nil, errors.New("kvStore cannot be nil")
	}
	if next == nil {
		return nil, errors.New("next cannot be nil")
	}
	mid := modeMiddleware{
		expectedModes: expectedModes,
		kvStore:       kvStore,
		next:          next,
	}
	return mid, nil
}

func (mid modeMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	authMode, ok := r.Context().Value(AuthMethodContextKey).(string)
	if !ok {
		log.Println("no auth method in context")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	deviceMode, err := mid.getDeviceMode()
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		log.Printf("error getting device mode: %v", err)
		return
	}
	modeMatch := false
	for _, expectedMode := range mid.expectedModes {
		if expectedMode == authMode {
			modeMatch = true
			break
		}
	}
	// AuthMode Check is OK when
	// The caller is the UI OR
	// The user's auth mode matches the current device mode
	// I.e. the user is using a web setup auth mode and the device is in web setup mode
	// And when the API is using this middleware configured using the expected mode.
	modeMatch = modeMatch && authMode == deviceMode
	modeMatch = modeMatch || authMode == AppAuthMode
	if !modeMatch {
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
