package middleware

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
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

const AppAuthMode = "app"
const APIAuthMode = "api"
const WebSetupAuthMode = "web_setup"
const NoAuthMode = "none"

func (mid authMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	authMethods := []authMethod{
		storedKeyAuthMethod(store.APIAppAuthKey, AppAuthMode, mid.kvStore),
		storedKeyAuthMethod(store.APIUserAuthKey, APIAuthMode, mid.kvStore),
		storedKeyAuthMethod(store.HotspotKey, WebSetupAuthMode, mid.kvStore),
	}
	for _, am := range authMethods {
		authRequest, err := am.validate(r)
		if err == nil {
			log.Printf("authorized request: %s", am.authName)
			mid.next.ServeHTTP(w, authRequest)
			return
		}
	}
	log.Println("unauthorized request")
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}

func storedKeyAuthMethod(key, authName string, kv KeyValueStore) authMethod {
	return authMethod{
		validator: func(r *http.Request) error {
			storedToken, err := kv.Get(key)
			if err != nil {
				return err
			}
			if len(storedToken) == 0 {
				return fmt.Errorf("no stored key for auth method: %s", authName)
			}

			authHeaderValue := r.Header.Get("Authorization")
			if authHeaderValue == "" || len(authHeaderValue) < 7 || authHeaderValue[:7] != "Bearer " {
				return errors.New("no Authorization header or invalid format")
			}
			// Strip "Bearer " prefix
			token := authHeaderValue[7:]
			match := subtle.ConstantTimeCompare([]byte(token), []byte(storedToken))
			if match == 1 {
				return nil
			}
			return errors.New("invalid token")
		},
		authName: authName,
	}
}

type authMethod struct {
	validator func(r *http.Request) error
	authName  string
}

func (am authMethod) validate(r *http.Request) (*http.Request, error) {
	err := am.validator(r)
	if err != nil {
		return nil, err
	}
	ctx := context.WithValue(r.Context(), AuthMethodContextKey, am.authName)
	return r.WithContext(ctx), nil
}

const AuthMethodContextKey = MiddlewareKey("auth_method")

type MiddlewareKey string
