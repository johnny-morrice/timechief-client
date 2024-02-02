package system

import (
	"errors"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
)

type Service struct {
	System           system.System
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
	WifiNetworkStore store.WifiNetworkStore
}

func (svc Service) FirewallSSHSetState(enabled bool) error {
	// TODO: Implement SetSSHFirewallState
	log.Printf("TODO SetSSHFirewallState: %v", enabled)
	return nil
}

func (svc Service) FirewallAPISetState(enabled bool) error {
	// TODO: Implement SetAPIFirewallState
	log.Printf("TODO SetAPIFirewallState: %v", enabled)
	return nil
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

func (svc Service) WifiSetActiveNetwork(ssid, key string) error {
	if ssid == "" {
		return errors.New("expected non-empty SSID")
	}
	return svc.WifiNetworkStore.SelectNetwork(ssid, key)
}

func (svc Service) WifiSetSelectedReadiness(ready bool) error {
	if ready {
		return svc.WifiNetworkStore.MarkSelectedReady()
	} else {
		return svc.WifiNetworkStore.MarkNotReady()
	}
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
