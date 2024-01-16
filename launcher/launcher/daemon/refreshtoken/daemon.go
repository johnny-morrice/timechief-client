package refreshtoken

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/authzero"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type Daemon struct {
	authZeroClient  AuthZeroClient
	kvStore         KvStore
	requestTimeout  time.Duration
	refreshInterval time.Duration
}

func MakeRefreshTokenDaemon(authZeroClient AuthZeroClient, kvStore KvStore, requestTimeout time.Duration, refreshInterval time.Duration) (Daemon, error) {
	if authZeroClient == nil {
		return Daemon{}, errors.New("authZeroClient cannot be nil")
	}
	if requestTimeout == 0 {
		return Daemon{}, errors.New("requestTimeout cannot be 0")
	}
	if refreshInterval == 0 {
		return Daemon{}, errors.New("refreshInterval cannot be 0")
	}
	result := Daemon{
		authZeroClient:  authZeroClient,
		kvStore:         kvStore,
		requestTimeout:  requestTimeout,
		refreshInterval: refreshInterval,
	}
	return result, nil
}

type KvStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

type AuthZeroClient interface {
	RefreshAccessToken(ctx context.Context, refreshToken string) (authzero.AccessTokenResp, error)
}

func (d Daemon) Start(ctx *cli.Context) {
	err := d.doTick()
	if err != nil {
		log.Printf("daemon tick error: %s", err)
	}
	util.RunEvery(d.refreshInterval, func() {
		err := d.doTick()
		if err != nil {
			log.Printf("daemon tick error: %s", err)
		}
	})
}

func (d Daemon) doTick() error {
	ready, err := d.isReadyForRenewal()
	if err != nil {
		return err
	}
	if ready {
		accessTokenText, err := d.kvStore.Get(store.AccessTokenKey)
		if err != nil {
			return fmt.Errorf("error getting access token: %s", err)
		}
		accessToken := authzero.AccessTokenResp{}
		err = json.Unmarshal([]byte(accessTokenText), &accessToken)
		if err != nil {
			return fmt.Errorf("error decoding access token: %s", err)
		}
		ctx := context.Background()
		ctx, cancel := context.WithTimeout(ctx, d.requestTimeout)
		defer cancel()
		newToken, err := d.authZeroClient.RefreshAccessToken(ctx, accessToken.RefreshToken)
		if err != nil {
			return fmt.Errorf("error refreshing token: %s", err)
		}
		newTokenText, err := json.Marshal(newToken)
		if err != nil {
			return fmt.Errorf("error marshalling refreshed token: %s", err)
		}
		err = d.kvStore.Set(store.AccessTokenKey, string(newTokenText))
		if err != nil {
			return fmt.Errorf("error setting refreshed token: %s", err)
		}
		tokenExpiry := TokenExpiry(newToken.ExpiresIn)
		err = d.kvStore.Set(store.TokenExpiryKey, tokenExpiry)
		if err != nil {
			// This error condition could cause a loop where we constantly try to refresh.
			return fmt.Errorf("error setting token expiry: %s", err)
		}
	}

	return nil
}

func (d Daemon) isReadyForRenewal() (bool, error) {
	expiredText, err := d.kvStore.Get(store.TokenExpiryKey)
	if err != nil {
		return false, fmt.Errorf("error getting token expiry")
	}
	expiredDate, err := time.Parse(time.RFC3339, expiredText)
	if err != nil {
		return false, fmt.Errorf("error parsing token expiry")
	}
	const readyInterval = time.Minute * 10
	ready := time.Until(expiredDate) <= readyInterval
	return ready, nil
}

func TokenExpiry(expiresIn int) string {
	expiryDate := time.Now().Add(time.Second * time.Duration(expiresIn))
	return expiryDate.Format(time.RFC3339)
}
