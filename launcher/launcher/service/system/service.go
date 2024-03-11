package system

import (
	"errors"
	"fmt"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/crypt"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
)

type Service struct {
	System           system.System
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
	WifiNetworkStore store.WifiNetworkStore
}

type SSHCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (svc Service) RegenerateSSHPassword() (SSHCredentials, error) {
	// TODO: Implement RegenerateSSHKey
	log.Printf("TODO RegenerateSSHKey")
	pass, err := crypt.GenerateSSHPassword()
	if err != nil {
		return SSHCredentials{}, fmt.Errorf("failed to generate SSH password: %w", err)
	}
	const username = "timechief"
	result := SSHCredentials{
		Username: username,
		Password: pass,
	}
	return result, nil
}

func (svc Service) FirewallSSHSetState(enabled bool) error {
	// TODO: Implement SetSSHFirewallState
	log.Printf("TODO SetSSHFirewallState: %v", enabled)
	return nil
}

func (svc Service) FirewallAPISetState(enabled bool) error {
	// TODO: Implement SetAPIFirewallState
	return svc.KeyValueStore.Set(store.APIAccessEnabled, fmt.Sprintf("%v", enabled))
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
