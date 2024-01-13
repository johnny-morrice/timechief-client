package licenseactivation

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type Daemon struct {
	client          v2.ClientInterface
	keyValueStore   KeyValueStore
	requestTimeout  time.Duration
	refreshInterval time.Duration
}

func MakeLicenseActivationDaemon(client v2.ClientInterface, keyValueStore KeyValueStore, requestTimeout time.Duration, refreshInterval time.Duration) (Daemon, error) {
	if client == nil {
		return Daemon{}, errors.New("client is nil")
	}
	if keyValueStore == nil {
		return Daemon{}, errors.New("keyValueStore is nil")
	}
	if requestTimeout <= 0 {
		return Daemon{}, errors.New("requestTimeout is not positive")
	}
	if refreshInterval <= 0 {
		return Daemon{}, errors.New("refreshInterval is not positive")
	}
	result := Daemon{
		client:          client,
		keyValueStore:   keyValueStore,
		requestTimeout:  requestTimeout,
		refreshInterval: refreshInterval,
	}
	return result, nil
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Delete(key string) error
}

func (d Daemon) Start(ctx cli.Context) {
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
	activationCode, err := d.keyValueStore.Get(store.LicenseActivationCodeKey)
	if err != nil {
		return err
	}

	log.Println("attempting license activation")

	_, err = d.keyValueStore.Get(store.AccessTokenKey)
	if err != nil {
		log.Println("no access token, skipping license activation")
		return err
	}
	err = d.activateOrder(activationCode)
	if err != nil {
		return err
	}
	err = d.keyValueStore.Delete(store.LicenseActivationCodeKey)
	if err != nil {
		return err
	}
	log.Println("license activated")
	return nil
}

func (d Daemon) activateOrder(activationCode string) error {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, d.requestTimeout)
	defer cancel()
	resp, err := d.client.ActivateOrder(ctx, v2.OrderActivation{
		Code: &activationCode,
	})
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("bad status: %s", resp.Status)
	}
	return nil
}
