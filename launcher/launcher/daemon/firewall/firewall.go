package firewall

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type FirewallDaemon struct {
	startTime                 time.Time
	graceDuration             time.Duration
	tickInterval              time.Duration
	isInitialFirewallUp       bool
	isHandleForceFirewallOpen bool
	keyValueStore             store.KeyValueStore
	sys                       System
}

func MakeFirewallDaemon(graceDuration time.Duration, tickInterval time.Duration, keyValueStore store.KeyValueStore, sys System) (FirewallDaemon, error) {
	if tickInterval == 0 {
		return FirewallDaemon{}, fmt.Errorf("tickInterval was 0")
	}

	if sys == nil {
		return FirewallDaemon{}, fmt.Errorf("sys was nil")
	}

	daemon := FirewallDaemon{
		startTime:           time.Now(),
		graceDuration:       graceDuration,
		tickInterval:        tickInterval,
		isInitialFirewallUp: false,

		keyValueStore: keyValueStore,
		sys:           sys,
	}
	return daemon, nil
}

type System interface {
	OpenFirewall(ports []string) error
}

func (daemon *FirewallDaemon) Start(ctx context.Context) {
	for range time.Tick(daemon.tickInterval) {
		err := daemon.doTick()
		if err != nil {
			log.Printf("FirewallDaemon tick error: %s", err)
		}
	}
}

func (daemon *FirewallDaemon) doTick() error {
	isPutFirewallUp := !daemon.isInitialFirewallUp && time.Since(daemon.startTime) > daemon.graceDuration
	if isPutFirewallUp {
		err := daemon.applyFirewallSettings()
		if err != nil {
			return err
		}
		daemon.isInitialFirewallUp = true
	}

	isForceFirewallOpen, err := daemon.keyValueStore.Get("firewall-force-open")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if isForceFirewallOpen == "true" && !daemon.isHandleForceFirewallOpen {
		err := daemon.sys.OpenFirewall([]string{"22", "80", "443"})
		if err != nil {
			return err
		}
		daemon.isHandleForceFirewallOpen = true
	} else {
		daemon.isHandleForceFirewallOpen = false
	}

	return nil
}

func (daemon *FirewallDaemon) applyFirewallSettings() error {
	ports := []string{}

	httpAccessText, err := daemon.keyValueStore.Get("firewall-open-http")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if httpAccessText == "true" {
		ports = append(ports, "80", "443")
	}

	sshAccessText, err := daemon.keyValueStore.Get("firewall-open-ssh")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if sshAccessText == "true" {
		ports = append(ports, "22")
	}

	return daemon.sys.OpenFirewall(ports)
}
