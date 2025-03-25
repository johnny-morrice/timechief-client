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
	tickInterval           time.Duration
	isCaptivePortalRunning bool
	isFirewallUpHandled    bool
	stateFlagStore         StateFlagStore
	svc                    Service
}

func MakeFirewallDaemon(tickInterval time.Duration, svc Service, stateFlagStore StateFlagStore) (FirewallDaemon, error) {
	if tickInterval == 0 {
		return FirewallDaemon{}, fmt.Errorf("tickInterval was 0")
	}

	if svc == nil {
		return FirewallDaemon{}, fmt.Errorf("svc was nil")
	}

	daemon := FirewallDaemon{
		tickInterval:           tickInterval,
		isCaptivePortalRunning: false,
		isFirewallUpHandled:    false,
		stateFlagStore:         stateFlagStore,

		svc: svc,
	}
	return daemon, nil
}

type StateFlagStore interface {
	Exists(state string) (bool, error)
}

type Service interface {
	ApplyFirewallRules() error
	RunCaptivePortal() error
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
	isRunCaptivePortal, err := daemon.stateFlagStore.Exists("run-captive-portal")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if isRunCaptivePortal && !daemon.isCaptivePortalRunning {
		err := daemon.svc.RunCaptivePortal()
		if err != nil {
			return err
		}
		daemon.isCaptivePortalRunning = true
		daemon.isFirewallUpHandled = false
		return nil
	}

	if !isRunCaptivePortal {
		daemon.isCaptivePortalRunning = false
	}

	isPutFirewallUp := !isRunCaptivePortal && !daemon.isFirewallUpHandled
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
