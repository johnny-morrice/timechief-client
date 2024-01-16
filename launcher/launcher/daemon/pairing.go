package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/authzero"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/refreshtoken"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type Pairing struct {
	KeyValueStore        store.KeyValueStore
	ConfigStore          store.ConfigStore
	StateFlagStore       store.StateFlagStore
	AuthZeroClient       AuthZeroClient
	PairingCheckInterval time.Duration
	RequestTimeout       time.Duration
}

func MakePairingDaemon(cfgStore store.ConfigStore, kvStore store.KeyValueStore, stateFlagStore store.StateFlagStore, authZeroClient AuthZeroClient, pairingCheckInterval time.Duration, requestTimeout time.Duration) Pairing {
	return Pairing{
		KeyValueStore:        kvStore,
		ConfigStore:          cfgStore,
		StateFlagStore:       stateFlagStore,
		AuthZeroClient:       authZeroClient,
		PairingCheckInterval: pairingCheckInterval,
		RequestTimeout:       requestTimeout,
	}
}

type AuthZeroClient interface {
	GetDeviceCode(ctx context.Context, clientID, audience string) (authzero.DeviceCodeResp, error)
	GetAccessToken(ctx context.Context, clientID, deviceCode string) (authzero.AccessTokenResp, error)
}

func (p Pairing) Initialise() error {
	err := p.KeyValueStore.Delete(store.PairingCodeKey)
	if err != nil {
		return fmt.Errorf("error deleting pairing code: %s", err)
	}

	err = p.StateFlagStore.Delete(store.PairingURLKey)
	if err != nil {
		return fmt.Errorf("error deleting pairing url: %s", err)
	}
	return nil
}

func (p Pairing) Start(ctx *cli.Context) {
	err := p.doTick(ctx)
	if err != nil {
		log.Printf("pairing daemon tick error: %s", err)
	}
	util.RunEvery(p.PairingCheckInterval, func() {
		err := p.doTick(ctx)
		if err != nil {
			log.Printf("pairing daemon tick error: %s", err)
		}
	})
}

func (p Pairing) doTick(ctx *cli.Context) error {
	isPairingRequested, err := p.StateFlagStore.Exists("pairing-requested")
	if err != nil {
		return fmt.Errorf("error checking pairing-requested flag: %s", err)
	}

	if isPairingRequested {
		log.Println("handling pairing request")
		exists, err := p.KeyValueStore.Exists(store.PairingCodeKey)
		if err != nil {
			return fmt.Errorf("error getting pairing code: %s", err)
		} else if !exists {
			return p.createPairing()
		}

		status, err := p.getPairingState()
		if err != nil {
			return fmt.Errorf("error getting pairing state: %s", err)
		}
		if status.AccessToken != "" {
			return p.handlePairingComplete(status)
		}
		if status.Error != "" {
			return p.handlePairingReady(status)
		}

	}
	return nil
}

func (p Pairing) createRequestContext() (context.Context, func()) {
	// TODO configure timeout
	const timeout = time.Second * 10
	ctx := context.Background()
	return context.WithTimeout(ctx, timeout)
}

func (p Pairing) createPairing() error {
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %s", err)
	}
	clientID, err := cfg.GetAuthZeroClientID()
	if err != nil {
		return err
	}
	audience, err := cfg.GetAuthZeroAudience()
	if err != nil {
		return err
	}
	ctx, cancel := p.createRequestContext()
	defer cancel()
	deviceResp, err := p.AuthZeroClient.GetDeviceCode(ctx, clientID, audience)
	if err != nil {
		return fmt.Errorf("error getting device code: %s", err)
	}
	err = p.KeyValueStore.Set(store.PairingCodeKey, deviceResp.DeviceCode)
	if err != nil {
		return fmt.Errorf("error setting pairing code: %s", err)
	}
	err = p.KeyValueStore.Set(store.PairingURLKey, deviceResp.VerificationUri)
	if err != nil {
		return fmt.Errorf("error setting pairing url: %s", err)
	}
	err = p.KeyValueStore.Set(store.PairingQRCodeURLKey, deviceResp.VerificationUriComplete)
	if err != nil {
		return fmt.Errorf("error setting pairing qr code URL: %s", err)
	}

	return nil
}

func (p Pairing) handlePairingReady(pairingError authzero.AccessTokenResp) error {
	// Nothing to do, wait for link.
	log.Printf("pairing poll got another error: %s %s", pairingError.Error, pairingError.ErrorDescription)
	return nil
}

func (p Pairing) handlePairingComplete(accessToken authzero.AccessTokenResp) error {
	err := p.StateFlagStore.Delete("pairing-requested")
	if err != nil {
		return fmt.Errorf("error deleting pairing-requested flag: %s", err)
	}
	err = p.KeyValueStore.Delete(store.PairingCodeKey)
	if err != nil {
		return fmt.Errorf("error clearing pairing code: %s", err)
	}
	err = p.KeyValueStore.Delete(store.PairingURLKey)
	if err != nil {
		return fmt.Errorf("error clearing pairing url: %s", err)
	}
	err = p.KeyValueStore.Delete(store.PairingQRCodeURLKey)
	if err != nil {
		return fmt.Errorf("error clearing pairing qr code url: %s", err)
	}
	bs, err := json.Marshal(accessToken)
	if err != nil {
		return fmt.Errorf("failed to marshal access token: %s", err)
	}
	err = p.KeyValueStore.Set(store.AccessTokenKey, string(bs))
	if err != nil {
		return fmt.Errorf("error setting access token: %s", err)
	}
	tokenExpiry := refreshtoken.TokenExpiry(accessToken.ExpiresIn)
	err = p.KeyValueStore.Set(store.TokenExpiryKey, tokenExpiry)
	if err != nil {
		return fmt.Errorf("error setting access token expiry: %s", err)
	}

	return nil
}

func (p Pairing) getPairingState() (authzero.AccessTokenResp, error) {
	cfg, err := p.ConfigStore.GetConfig()
	var nope authzero.AccessTokenResp
	if err != nil {
		return nope, fmt.Errorf("error getting config: %s", err)
	}
	deviceCode, err := p.KeyValueStore.Get(store.PairingCodeKey)
	if err != nil {
		return nope, fmt.Errorf("error getting pairing code: %s", err)
	}
	clientID, err := cfg.GetAuthZeroClientID()
	if err != nil {
		return nope, err
	}
	ctx, cancel := p.createRequestContext()
	defer cancel()
	return p.AuthZeroClient.GetAccessToken(ctx, clientID, deviceCode)
}

func (p Pairing) newClientContext() (context.Context, func()) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, p.RequestTimeout)
	return ctx, cancel
}
