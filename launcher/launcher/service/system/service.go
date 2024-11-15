package system

import (
	"errors"
	"fmt"
	"log"
	"strconv"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/crypt"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/firewall"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
)

type Service struct {
	System           system.System
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
	WifiNetworkStore store.WifiNetworkStore
	FirewallService  FirewallService
}

type FirewallService interface {
	SetServiceState(ss firewall.ServiceState) error
	ApplyFirewallRules() error
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
	err := svc.FirewallService.SetServiceState(firewall.ServiceState{
		Service: "ssh",
		Open:    enabled,
	})
	if err != nil {
		return err
	}
	return svc.FirewallService.ApplyFirewallRules()
}

func (svc Service) FirewallAPISetState(enabled bool) error {
	apiAccessMode := strconv.FormatBool(enabled)
	err := svc.KeyValueStore.Set(store.APIAccessEnabled, apiAccessMode)
	if err != nil {
		return fmt.Errorf("error setting API access mode: %w", err)
	}
	err = svc.FirewallService.SetServiceState(firewall.ServiceState{
		Service: "http",
		Open:    enabled,
	})
	if err != nil {
		return fmt.Errorf("error setting API firewall service state: %w", err)
	}
	err = svc.FirewallService.ApplyFirewallRules()
	if err != nil {
		return fmt.Errorf("error firewall rules after API access change: %w", err)
	}
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
