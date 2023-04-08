package daemon

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

type Pairing struct {
	ConfigStore          store.ConfigStore
	StateFlagStore       store.StateFlagStore
	PairingCheckInterval time.Duration
	RequestTimeout       time.Duration
}

func (p Pairing) Initialise() error {
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %s", err)
	}
	cfg.ClearPairingCode()
	err = p.ConfigStore.SetConfig(cfg)
	if err != nil {
		return fmt.Errorf("error setting config: %s", err)
	}
	return nil
}

func (p Pairing) Start(ctx *cli.Context) {
	err := p.doTick(ctx)
	if err != nil {
		log.Printf("pairing daemon tick error: %s", err)
	}
	runEvery(p.PairingCheckInterval, func() {
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
		cfg, err := p.ConfigStore.GetConfig()
		if err != nil {
			return fmt.Errorf("error getting config: %s", err)
		}
		_, err = cfg.GetPairingCode()
		if err != nil && !errors.Is(err, store.ErrCfgNotFound) {
			return fmt.Errorf("error getting pairing code: %s", err)
		} else if errors.Is(err, store.ErrCfgNotFound) {
			return p.createPairing()
		}

		status, err := p.getPairingState()
		if err != nil {
			return fmt.Errorf("error getting pairing state: %s", err)
		}
		switch status.Status {
		case "complete":
			return p.handlePairingComplete()
		case "ready":
			return p.handlePairingReady()
		case "linked":
			return p.handlePairingLinked()
		}
	}
	return nil
}

func (p Pairing) createPairing() error {
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %s", err)
	}
	token, err := cfg.GetAccessToken()
	if err != nil {
		return fmt.Errorf("error getting access token: %s", err)
	}
	client, err := serviceclient.MakeAPIClient(cfg, token)
	if err != nil {
		return fmt.Errorf("error making api client: %s", err)
	}
	ctx, cancel := p.newClientContext()
	defer cancel()
	code, err := client.Pairing.CreatePairing(ctx)
	if err != nil {
		return fmt.Errorf("error creating pairing: %s", err)
	}
	cfg.SetPairingCode(code.Code)
	err = p.ConfigStore.SetConfig(cfg)
	if err != nil {
		return fmt.Errorf("error setting config: %s", err)
	}
	return nil
}

func (p Pairing) handlePairingLinked() error {
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %s", err)
	}
	token, err := cfg.GetAccessToken()
	if err != nil {
		return fmt.Errorf("error getting access token: %s", err)
	}
	code, err := cfg.GetPairingCode()
	if err != nil {
		return fmt.Errorf("error getting pairing code: %s", err)
	}
	client, err := serviceclient.MakeAPIClient(cfg, token)
	if err != nil {
		return fmt.Errorf("error making api client: %s", err)
	}
	ctx, cancel := p.newClientContext()
	defer cancel()
	err = client.Pairing.CompletePairing(ctx, code)
	if err != nil {
		return fmt.Errorf("error completing pairing: %s", err)
	}
	return nil
}

func (p Pairing) handlePairingReady() error {
	// Nothing to do, wait for link.
	return nil
}

func (p Pairing) handlePairingComplete() error {
	err := p.StateFlagStore.Delete("pairing-requested")
	if err != nil {
		return fmt.Errorf("error deleting pairing-requested flag: %s", err)
	}
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %s", err)
	}
	cfg.ClearPairingCode()
	err = p.ConfigStore.SetConfig(cfg)
	if err != nil {
		return fmt.Errorf("error setting config: %s", err)
	}
	return nil
}

func (p Pairing) getPairingState() (viewmodel.PairingStatus, error) {
	cfg, err := p.ConfigStore.GetConfig()
	if err != nil {
		return viewmodel.PairingStatus{}, fmt.Errorf("error getting config: %s", err)
	}
	token, err := cfg.GetAccessToken()
	if err != nil {
		return viewmodel.PairingStatus{}, fmt.Errorf("error getting access token: %s", err)
	}
	code, err := cfg.GetPairingCode()
	if err != nil {
		return viewmodel.PairingStatus{}, fmt.Errorf("error getting pairing code: %s", err)
	}
	client, err := serviceclient.MakeAPIClient(cfg, token)
	if err != nil {
		return viewmodel.PairingStatus{}, fmt.Errorf("error making api client: %s", err)
	}
	ctx, cancel := p.newClientContext()
	defer cancel()

	status, err := client.Pairing.GetPairing(ctx, code)
	if err != nil {
		return viewmodel.PairingStatus{}, fmt.Errorf("error getting pairing status: %s", err)
	}
	return *status, nil
}

func (p Pairing) newClientContext() (context.Context, func()) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, p.RequestTimeout)
	return ctx, cancel
}
