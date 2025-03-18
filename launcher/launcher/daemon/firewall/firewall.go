package firewall

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

type FirewallDaemon struct {
	startTime                 time.Time
	graceDuration             time.Duration
	tickInterval              time.Duration
	isGraceStartHandled       bool
	isHandleForceFirewallOpen bool
	isGraceIncludeSSH         bool
	isFirewallUpHandled       bool
	stateFlagStore            StateFlagStore
	sys                       System
	svc                       Service
}

func MakeFirewallDaemon(isGraceIncludeSSH bool, graceDuration time.Duration, tickInterval time.Duration, sys System, svc Service, stateFlagStore StateFlagStore) (FirewallDaemon, error) {
	if tickInterval == 0 {
		return FirewallDaemon{}, fmt.Errorf("tickInterval was 0")
	}

	if sys == nil {
		return FirewallDaemon{}, fmt.Errorf("sys was nil")
	}

	if svc == nil {
		return FirewallDaemon{}, fmt.Errorf("svc was nil")
	}

	daemon := FirewallDaemon{
		startTime:           time.Now(),
		graceDuration:       graceDuration,
		tickInterval:        tickInterval,
		isGraceStartHandled: false,
		isGraceIncludeSSH:   isGraceIncludeSSH,
		stateFlagStore:      stateFlagStore,

		sys: sys,
		svc: svc,
	}
	return daemon, nil
}

type StateFlagStore interface {
	Exists(state string) (bool, error)
}

type Service interface {
	ApplyFirewallRules() error
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
	gracePorts := []string{"80", "443", "53", "67"}
	if daemon.isGraceIncludeSSH {
		gracePorts = append(gracePorts, "22")
	}

	isForceFirewallOpen, err := daemon.stateFlagStore.Exists("firewall-force-open")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	isInGracePeriod := time.Since(daemon.startTime) < daemon.graceDuration

	if isForceFirewallOpen && !daemon.isHandleForceFirewallOpen {
		err := daemon.sys.OpenFirewall(gracePorts)
		if err != nil {
			return err
		}
		daemon.isHandleForceFirewallOpen = true
		daemon.isFirewallUpHandled = false
		return nil
	}

	if !isForceFirewallOpen {
		daemon.isHandleForceFirewallOpen = false
	}

	if isInGracePeriod && !daemon.isGraceStartHandled && !daemon.isHandleForceFirewallOpen {
		err := daemon.sys.OpenFirewall(gracePorts)
		if err != nil {
			return err
		}
		daemon.isGraceStartHandled = true
		daemon.isFirewallUpHandled = false
		return nil
	}

	isPutFirewallUp := !isForceFirewallOpen && !isInGracePeriod && !daemon.isFirewallUpHandled
	if isPutFirewallUp {
		err := daemon.svc.ApplyFirewallRules()
		if err != nil {
			return err
		}
		daemon.isFirewallUpHandled = true
		return nil
	}

	return nil
}
