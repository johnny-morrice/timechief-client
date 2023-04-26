package system

import (
	"errors"
	"fmt"
	"math/rand"

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
	return svc.StateFlagStore.CreateIfNotExists("wifi-connect")
}

func (svc Service) WifiSetActiveNetwork(ssid string) error {
	if ssid == "" {
		return errors.New("expected non-empty SSID")
	}
	return svc.WifiNetworkStore.SetActive(ssid)
}

func (svc Service) WifiScan() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-scan")
}

func randomNum() string {
	suffix := rand.Int31n(899999) + 100000
	return fmt.Sprintf("%d", suffix)
}

func generateHotspotSSID() string {
	return "timechief" + randomNum()
}

func generateHotspotKey() string {
	return "tc" + randomNum()
}

func (svc Service) WifiHotspot() error {
	ssid := generateHotspotSSID()
	key := generateHotspotKey()
	err := svc.KeyValueStore.Set(store.HotspotSSID, ssid)
	if err != nil {
		return err
	}
	err = svc.KeyValueStore.Set(store.HotspotKey, key)
	if err != nil {
		return err
	}
	return svc.StateFlagStore.CreateIfNotExists("wifi-hotspot")
}

func (svc Service) WifiLoadInterfaces() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-load-interfaces")
}
