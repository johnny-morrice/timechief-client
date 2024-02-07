package middleware

import (
	"crypto/subtle"
	"errors"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type KeyValueStore interface {
	Get(key string) (string, error)
}

type authMiddleware struct {
	kvStore KeyValueStore
	next    http.Handler
}

// Create a new middleware compatible with http.ServeMux.
func NewAuthMiddleware(kvStore KeyValueStore, next http.Handler) (http.Handler, error) {
	if kvStore == nil {
		return nil, errors.New("kvStore cannot be nil")
	}
	if next == nil {
		return nil, errors.New("next cannot be nil")
	}
	mid := authMiddleware{
		kvStore: kvStore,
		next:    next,
	}
	return mid, nil
}

func (mid authMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	apiAuthKvKeys := []string{
		store.APIAppAuthKey,
		store.APIUserAuthKey,
	}
	validAPIKeys := []string{}
	for _, key := range apiAuthKvKeys {
		value, err := mid.kvStore.Get(key)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("error getting API key %s: %s", key, err)
			continue
		}
		validAPIKeys = append(validAPIKeys, value)
	}

	authHeaderValue := r.Header.Get("Authorization")
	if authHeaderValue == "" || len(authHeaderValue) < 7 || authHeaderValue[:7] != "Bearer " {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	// Strip "Bearer " prefix
	token := authHeaderValue[7:]
	for _, validKey := range validAPIKeys {
		match := subtle.ConstantTimeCompare([]byte(token), []byte(validKey))
		if match == 1 {
			mid.next.ServeHTTP(w, r)
			return
		}
	}
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}
