package firewall

import (
	"errors"
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type FirewallService struct {
	keyValueStore store.KeyValueStore
	sys           System
}

func MakeFirewallService(keyValueStore store.KeyValueStore, sys System) (FirewallService, error) {
	if sys == nil {
		return FirewallService{}, fmt.Errorf("sys was nil")
	}

	svc := FirewallService{
		keyValueStore: keyValueStore,
		sys:           sys,
	}
	return svc, nil
}

type System interface {
	OpenFirewall(ports []string) error
	RunCaptivePortal(ports []string) error
}

var serviceMap map[string]string

func init() {
	serviceMap = map[string]string{
		"http": "firewall-open-http",
		"ssh":  "firewall-open-ssh",
	}
}

type ServiceState struct {
	Service string `json:"service"`
	Open    bool   `json:"open"`
}

func (svc FirewallService) SetServiceState(ss ServiceState) error {
	// TODO should error when captive portal running.

	kvRule, ok := serviceMap[ss.Service]

	if !ok {
		return fmt.Errorf("unknown service: %s", ss.Service)
	}

	val := "false"
	if ss.Open {
		val = "true"
	}

	err := svc.keyValueStore.Set(kvRule, val)
	if err != nil {
		return err
	}

	return svc.ApplyFirewallRules()
}

func (svc FirewallService) RunCaptivePortal() error {
	ports := []string{"443", "80"}

	sshAccessText, err := svc.keyValueStore.Get("firewall-open-ssh")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if sshAccessText == "true" {
		ports = append(ports, "22")
	}

	return svc.sys.RunCaptivePortal(ports)
}

func (svc FirewallService) ApplyFirewallRules() error {
	ports := []string{}

	httpAccessText, err := svc.keyValueStore.Get("firewall-open-http")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if httpAccessText == "true" {
		ports = append(ports, "80", "443")
	}

	sshAccessText, err := svc.keyValueStore.Get("firewall-open-ssh")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if sshAccessText == "true" {
		ports = append(ports, "22")
	}

	return svc.sys.OpenFirewall(ports)
}
