package middleware

import (
	"errors"
	"log"
	"net/http"
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

func GetAuthContext(r *http.Request) string {
	authMode, ok := r.Context().Value(AuthMethodContextKey).(string)
	if !ok {
		return NoAuthMode

	}
	return authMode
}

func GetDeviceContext(r *http.Request) string {
	authMode, ok := r.Context().Value(DeviceModeContextKey).(string)
	if !ok {
		return NoAuthMode

	}
	return authMode
}

func (mid modeMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	authMode := GetAuthContext(r)
	if authMode == NoAuthMode {
		log.Println("no auth mode in mode middleware")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Always serve to the app.
	if authMode == AppAuthMode {
		mid.next.ServeHTTP(w, r)
		return
	}

	deviceMode := GetDeviceContext(r)

	// Check we are handling an expected mode for this middleware.
	// E.g. websetup only handles web setup mode.
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
	if modeMatch && authMode == deviceMode {
		mid.next.ServeHTTP(w, r)
		return
	}

	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	log.Printf("auth mode '%s' does not match device mode '%s'", authMode, deviceMode)

}
