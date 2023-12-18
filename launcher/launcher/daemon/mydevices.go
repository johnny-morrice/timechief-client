package daemon

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type MyDevices struct {
	client          v2.ClientInterface
	keyValueStore   store.KeyValueStore
	stateFlagStore  store.StateFlagStore
	requestTimeout  time.Duration
	refreshInterval time.Duration
}

func MakeMyDevices(client v2.ClientInterface, keyValueStore store.KeyValueStore, stateFlagStore store.StateFlagStore, requestTimeout time.Duration, refreshInterval time.Duration) MyDevices {
	return MyDevices{
		client:          client,
		keyValueStore:   keyValueStore,
		stateFlagStore:  stateFlagStore,
		requestTimeout:  requestTimeout,
		refreshInterval: refreshInterval,
	}
}

func (md MyDevices) Start(ctx *cli.Context) {
	err := md.doTick(ctx)
	if err != nil {
		log.Printf("mydevices daemon tick error: %s", err)
	}
	runEvery(md.refreshInterval, func() {
		err := md.doTick(ctx)
		if err != nil {
			log.Printf("mydevices daemon tick error: %s", err)
		}
	})
}

func (md MyDevices) doTick(ctx *cli.Context) error {
	log.Println("downloading mydevices")
	needsRefresh, err := md.stateFlagStore.Exists("refresh-mydevices")
	if err != nil {
		return err
	}
	if !needsRefresh {
		return nil
	}
	log.Println("refreshing mydevices")
	devices, err := md.fetch()
	if err != nil {
		return err
	}
	if len(devices) == 1 {
		err = md.keyValueStore.Set(store.DeviceUUIDKey, *devices[0].Uuid)
		if err != nil {
			return err
		}
	}
	err = md.setMyDevices(devices)
	if err != nil {
		return err
	}
	err = md.stateFlagStore.Delete("refresh-mydevices")
	if err != nil {
		return err
	}
	return nil
}

func (md MyDevices) setMyDevices(devices []v2.Device) error {
	buffer := bytes.Buffer{}
	err := json.NewEncoder(&buffer).Encode(devices)
	if err != nil {
		return err
	}
	err = md.keyValueStore.Set(store.MyDevicesKey, buffer.String())
	if err != nil {
		return err
	}
	return nil
}

func (md MyDevices) fetch() ([]v2.Device, error) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, md.requestTimeout)
	defer cancel()
	// TODO: Pagination
	params := v2.ListDevicesParams{
		Limit: 50,
	}
	resp, err := md.client.ListDevices(ctx, &params)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	var result []v2.Device
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
