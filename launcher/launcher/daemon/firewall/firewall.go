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
	isGraceStarted            bool
	isGraceEnded              bool
	isHandleForceFirewallOpen bool
	isGraceIncludeSSH         bool
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
		startTime:         time.Now(),
		graceDuration:     graceDuration,
		tickInterval:      tickInterval,
		isGraceEnded:      false,
		isGraceStarted:    false,
		isGraceIncludeSSH: isGraceIncludeSSH,
		stateFlagStore:    stateFlagStore,

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
	gracePorts := []string{"80", "443"}
	if daemon.isGraceIncludeSSH {
		gracePorts = append(gracePorts, "22")
	}
	if !daemon.isGraceStarted {
		if time.Since(daemon.startTime) < daemon.graceDuration {
			err := daemon.sys.OpenFirewall(gracePorts)
			if err != nil {
				return err
			}
		}
		daemon.isGraceStarted = true
	}

	isPutFirewallUp := daemon.isGraceStarted && !daemon.isGraceEnded && time.Since(daemon.startTime) > daemon.graceDuration
	if isPutFirewallUp {
		err := daemon.svc.ApplyFirewallRules()
		if err != nil {
			return err
		}
		daemon.isGraceEnded = true
	}

	isForceFirewallOpen, err := daemon.stateFlagStore.Exists("firewall-force-open")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if isForceFirewallOpen && !daemon.isHandleForceFirewallOpen {
		err := daemon.sys.OpenFirewall(gracePorts)
		if err != nil {
			return err
		}
		daemon.isHandleForceFirewallOpen = true
	}

	if !isForceFirewallOpen && daemon.isHandleForceFirewallOpen {
		err := daemon.svc.ApplyFirewallRules()
		if err != nil {
			return err
		}
		daemon.isHandleForceFirewallOpen = false
	}

	return nil
}
