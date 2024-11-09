package websetup

import (
	"errors"
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	store   WifiNetworkStore
	kvStore store.KeyValueStore
}

type WifiNetworkStore interface {
	SelectNetwork(ssid, key string) error
	List() ([]store.WifiNetwork, error)
}

func MakeService(store WifiNetworkStore, kvStore store.KeyValueStore) (Service, error) {
	if store == nil {
		return Service{}, errors.New("store cannot be nil")
	}
	svc := Service{store: store, kvStore: kvStore}
	return svc, nil
}

func (svc Service) ListNetworks() ([]WifiNetwork, error) {
	storeNets, err := svc.store.List()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []WifiNetwork{}, nil
		}
		return nil, fmt.Errorf("error listing networks: %w", err)
	}
	networks := make([]WifiNetwork, len(storeNets))
	for i, storeNet := range storeNets {
		networks[i] = WifiNetwork{
			SSID:           storeNet.SSID,
			SignalStrength: storeNet.Signal,
			Encryption:     storeNet.Encryption,
		}
	}
	return networks, nil
}

func (svc Service) WifiSetActiveNetwork(ssid, key string) error {
	err := svc.store.SelectNetwork(ssid, key)
	if err != nil {
		return fmt.Errorf("error selecting network: %w", err)
	}
	return nil
}

func (svc Service) ChooseNetworkType(networkType string) error {
	if networkType != "wifi" && networkType != "manual" {
		return fmt.Errorf("unsupported network type: %s", networkType)
	}

	return svc.kvStore.Set("network-type", networkType)
}

type WifiNetwork struct {
	SSID           string `json:"ssid"`
	SignalStrength int    `json:"signal_strength"`
	Encryption     string `json:"encryption"`
}
