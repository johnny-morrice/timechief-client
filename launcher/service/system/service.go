package system

import (
	"errors"

	"github.com/google/uuid"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
)

type Service struct {
	System           system.System
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
	WifiNetworkStore store.WifiNetworkStore
}

func (svc Service) Reboot() error {
	return svc.System.Reboot()
}
func (svc Service) Shutdown() error {
	return svc.System.Shutdown()
}

func (svc Service) WifiConnect() error {
	id := uuid.NewString()
	err := svc.WifiNetworkStore.MarkSelectedReady()
	if err != nil {
		return err
	}
	return svc.KeyValueStore.Set("wifi-connect", id)
}

func (svc Service) WifiSetActiveNetwork(ssid, key string) error {
	if ssid == "" {
		return errors.New("expected non-empty SSID")
	}
	return svc.WifiNetworkStore.SelectNetwork(ssid, key)
}

func (svc Service) WifiScan() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-scan")
}

func (svc Service) WifiHotspot() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-hotspot")
}

func (svc Service) WifiLoadInterfaces() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-load-interfaces")
}
