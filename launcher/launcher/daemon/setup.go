package daemon

import (
	"errors"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type Setup struct {
	System           system.System
	WifiNetworkStore store.WifiNetworkStore
	StateFlagStore   store.StateFlagStore
	KeyValueStore    store.KeyValueStore
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

	err = daemon.init()
	if err != nil {
		log.Printf("setup daemon init error: %s", err)
	}

	util.RunEvery(daemon.RefreshInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Printf("setup daemon tick error: %s", err)
		}
	})
}

func (daemon Setup) init() error {
	state, err := daemon.KeyValueStore.Get("setup")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return daemon.KeyValueStore.Set("setup", SetupFlagBegin)
		}
		return err
	}

	switch state {
	// These are cases that we are OK starting in.
	case SetupFlagBegin:
	case SetupFlagInternetConnected:
		// Connect to internet if we are not already.
		err = daemon.WifiNetworkStore.MarkSelectedReady()
		if err != nil {
			return err
		}
		_, err = daemon.WifiNetworkStore.GetActive()
		if err == nil {
			err = daemon.StateFlagStore.CreateIfNotExists("wifi-connect")
			if err != nil {
				return err
			}
		}
		return nil
	default:
		log.Printf("setup daemon init: resetting after starting with state %s", state)
		// Any other state, start over.
		return daemon.KeyValueStore.Set("setup", SetupFlagBegin)
	}
	return nil
}

const (
	SetupFlagBegin                 string = "Begin"
	SetupFlagChooseNetworkType     string = "WaitUserChooseSetupType"
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
	case SetupFlagChooseNetworkType:
		return daemon.handleChooseNetworkType()
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

func (daemon Setup) setInitialSoundState() error {
	err := daemon.KeyValueStore.Set("mute", "false")
	if err != nil {
		return err
	}
	err = daemon.KeyValueStore.Set("unmute-range", "9-21")
	if err != nil {
		return err
	}
	return nil
}

func (daemon Setup) handleBegin() error {
	err := daemon.setInitialSoundState()
	if err != nil {
		return err
	}
	// Wipe all setup data.
	err = daemon.WifiNetworkStore.MarkNotReady()
	if err != nil {
		return err
	}

	err = daemon.KeyValueStore.Delete("setup-wifi-uuid")
	if err != nil {
		return err
	}

	err = daemon.StateFlagStore.Delete("wifi-connect")
	if err != nil {
		return err
	}

	err = daemon.StateFlagStore.CreateIfNotExists("wifi-load-interfaces")
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

	return daemon.KeyValueStore.Set("setup", SetupFlagChooseNetworkType)
}

func (daemon Setup) handleChooseNetworkType() error {
	networkType, err := daemon.KeyValueStore.Get("network-type")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if networkType == "" {
		return nil
	}

	switch networkType {
	case "wifi":
		return daemon.KeyValueStore.Set("setup", SetupFlagWaitHotspot)
	case "manual":
		return daemon.handleManualSetupCompletion()
	default:
		return fmt.Errorf("unknown network type: %s", networkType)
	}
}

func (daemon Setup) handleManualSetupCompletion() error {
	err := daemon.System.DownHotspot()
	if err != nil {
		return fmt.Errorf("setup failed to put down possible hotspot for manaul setup option")
	}
	return daemon.KeyValueStore.Set("setup", SetupFlagNetworkConnected)
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	if actualMode != mode {
		return false, nil
	}

	actualIP, err := daemon.KeyValueStore.Get(store.IPAddressKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	log.Printf("launcher setup found active network: %s", active.SSID)
	return daemon.KeyValueStore.Set("setup", SetupFlagNetworkSelected)
}

func (daemon Setup) handleNetworkSelected() error {
	err := daemon.StateFlagStore.CreateIfNotExists("wifi-connect")
	if err != nil {
		return err
	}
	err = daemon.KeyValueStore.Set("setupWifiConnectTime", time.Now().Format(time.RFC3339))
	if err != nil {
		return err
	}
	return daemon.KeyValueStore.Set("setup", SetupFlagWaitNetworkConnect)
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

const connectTimeout = time.Minute * 5

func (daemon Setup) handleWaitNetworkConnect() error {
	// Get active network
	active, err := daemon.WifiNetworkStore.GetActive()
	if err != nil {
		return err
	}

	// Check for connection timeout.
	timeText, err := daemon.KeyValueStore.Get("setupWifiConnectTime")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if timeText != "" {
		connectTime, err := time.Parse(time.RFC3339, timeText)
		if err != nil {
			return err
		}
		if time.Since(connectTime) > connectTimeout {
			log.Printf("setup timed out connecting to wifi network: %s, connection state: %s", active.SSID, active.ConnectionState)
			return daemon.KeyValueStore.Set("setup", SetupFlagBegin)
		}
	}

	if active.ConnectionState != "connected" {
		log.Println("setup still waiting for wifi connection")
		return nil
	}

	// Check for IP address and infra mode.
	ok, err := daemon.isInterfaceSetup(system.InfraMode, func(ipText string) bool {
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
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
		err = daemon.KeyValueStore.Set("firstTimeSetupDone", "true")
		if err != nil {
			return err
		}
		return daemon.KeyValueStore.Set("setup", SetupFlagInternetConnected)
	}

	return nil
}

func (daemon Setup) handleInternetConnected() error {
	return nil
}
