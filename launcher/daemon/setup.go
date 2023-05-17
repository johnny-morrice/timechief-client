package daemon

import (
	"errors"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type Setup struct {
	System           system.System
	WifiNetworkStore store.WifiNetworkStore
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
	Cache            store.CacheStore
	RefreshInterval  time.Duration
}

func (daemon Setup) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Printf("setup daemon tick error: %s", err)
	}
	if daemon.RefreshInterval == 0 {
		daemon.RefreshInterval = 1 * time.Second
	}
	runEvery(daemon.RefreshInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Printf("setup daemon tick error: %s", err)
		}
	})
}

const (
	SetupFlagBegin                 string = "Begin"
	SetupFlagWaitHotspot           string = "WaitHotspot"
	SetupFlagWaitUserSelectNetwork string = "WaitUserSelectNetwork"
	SetupFlagNetworkSelected       string = "NetworkSelected"
	SetupFlagWaitNetworkConnect    string = "WaitNetworkConnect"
	SetupFlagNetworkConnected      string = "NetworkConnected"
	SetupFlagInternetConnected     string = "InternetConnected"
)

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (daemon Setup) doTick(ctx *cli.Context) error {
	state, err := daemon.KeyValueStore.Get("setup")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return daemon.handleBegin()
		}
		return err
	}
	switch state {
	case SetupFlagBegin:
		return daemon.handleBegin()
	case SetupFlagWaitHotspot:
		return daemon.handleHotspotWait()
	case SetupFlagWaitUserSelectNetwork:
		return daemon.handleWaitUserSelectNetwork()
	case SetupFlagNetworkSelected:
		return daemon.handleNetworkSelected()
	case SetupFlagWaitNetworkConnect:
		return daemon.handleWaitNetworkConnect()
	case SetupFlagNetworkConnected:
		return daemon.handleNetworkConnected()
	case SetupFlagInternetConnected:
		return daemon.handleInternetConnected()
	default:
		return fmt.Errorf("unknown setup state: %s", state)
	}
}

func (daemon Setup) handleBegin() error {
	// Wipe all setup data.
	err := daemon.WifiNetworkStore.UnsetActive()
	if err != nil {
		return err
	}

	err = daemon.System.KeyValueStore.Delete("setup-wifi-uuid")
	if err != nil {
		return err
	}

	err = daemon.StateFlagStore.CreateIfNotExists("wifi-scan")
	if err != nil {
		return err
	}
	err = daemon.StateFlagStore.CreateIfNotExists("wifi-hotspot")
	if err != nil {
		return err
	}
	return daemon.KeyValueStore.Set("setup", SetupFlagWaitHotspot)
}

func (daemon Setup) handleHotspotWait() error {
	ok, err := daemon.isInterfaceSetup(system.AccessPointMode, func(ip string) bool { return ip == system.AccessPointIPAddress })
	if err != nil {
		return err
	}
	if !ok {
		return nil
	}
	return daemon.KeyValueStore.Set("setup", SetupFlagWaitUserSelectNetwork)
}

func (daemon Setup) isInterfaceSetup(mode string, ipMatch func(ip string) bool) (bool, error) {
	actualMode, err := daemon.KeyValueStore.Get(store.InterfaceModeKey)
	if err != nil {
		return false, err
	}

	if actualMode != mode {
		return false, nil
	}

	actualIP, err := daemon.KeyValueStore.Get(store.IPAddressKey)
	if err != nil {
		return false, err
	}
	if !ipMatch(actualIP) {
		return false, nil
	}

	return true, nil
}

func (daemon Setup) handleWaitUserSelectNetwork() error {
	active, err := daemon.WifiNetworkStore.GetActive()
	if err != nil {
		return err
	}
	log.Printf("launcher setup found active network: %s", active.SSID)
	return daemon.KeyValueStore.Set("setup", SetupFlagNetworkSelected)
}

func (daemon Setup) handleNetworkSelected() error {
	connectID := uuid.NewString()
	err := daemon.KeyValueStore.Set("setup-wifi-uuid", connectID)
	if err != nil {
		return err
	}
	return daemon.KeyValueStore.Set("wifi-connect", connectID)
}

var privateIPBlocks []*net.IPNet

func init() {
	for _, cidr := range []string{
		"10.0.0.0/8",     // RFC1918
		"172.16.0.0/12",  // RFC1918
		"192.168.0.0/16", // RFC1918
		"169.254.0.0/16", // RFC3927 link-local
		"fe80::/10",      // IPv6 link-local
		"fc00::/7",       // IPv6 unique local addr
	} {
		_, block, err := net.ParseCIDR(cidr)
		if err != nil {
			panic(fmt.Errorf("parse error on %q: %v", cidr, err))
		}
		privateIPBlocks = append(privateIPBlocks, block)
	}
}

func (daemon Setup) handleWaitNetworkConnect() error {
	connectID, err := daemon.KeyValueStore.Get("setup-wifi-uuid")
	if err != nil {
		return err
	}
	ok, err := daemon.Cache.Exists(connectID)
	if err != nil {
		return err
	}
	if !ok {
		return nil
	}
	// Check for IP address and infra mode.
	ok, err = daemon.isInterfaceSetup(system.InfraMode, func(ipText string) bool {
		ip := net.ParseIP(ipText)
		if ip == nil {
			return false
		}
		for _, block := range privateIPBlocks {
			if block.Contains(ip) {
				return true
			}
		}
		return false
	})

	if err != nil {
		return err
	}

	if !ok {
		return nil
	}
	// Clear last internet check time.
	err = daemon.KeyValueStore.Delete(store.LastInternetCheckKey)
	if err != nil {
		return err
	}

	return daemon.KeyValueStore.Set("setup", SetupFlagNetworkConnected)
}

func (daemon Setup) handleNetworkConnected() error {
	val, err := daemon.KeyValueStore.Get(store.LastInternetCheckKey)
	if err != nil {
		return err
	}
	// TODO fix race condition with internet check.
	// We should store when we enter this state and also store when the internet check began to make sure they are consistent.
	const validDuration = time.Second * 10
	checkTime, err := time.Parse(time.RFC3339, val)
	if err != nil {
		return err
	}
	if time.Since(checkTime) < validDuration {
		return daemon.KeyValueStore.Set("setup", SetupFlagInternetConnected)
	}

	return nil
}

func (daemon Setup) handleInternetConnected() error {
	return nil
}
