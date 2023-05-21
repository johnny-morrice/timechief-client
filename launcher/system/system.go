package system

import (
	"errors"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system/netcmd"
	"gorm.io/gorm"
)

type System struct {
	DB                 *gorm.DB
	Cache              store.CacheStore
	ConfigStore        store.ConfigStore
	KeyValueStore      store.KeyValueStore
	WifiInterfaceStore store.WifiInterfaceStore
	WifiNetworkStore   store.WifiNetworkStore
}

func (sys System) stopApp() error {
	return store.CloseDB(sys.DB)
}

func (sys System) runSudoScript(cfg store.Config, path string) error {
	root := cfg.GetInstallRoot()
	script := filepath.Join(root, path)
	output, err := exec.Command("sudo", script).CombinedOutput()
	log.Printf("system script %s output: %s", script, output)
	if err != nil {
		return fmt.Errorf("failed to execute system script %s: %w", path, err)
	}
	return nil
}

func (sys System) doShutdown() error {
	log.Printf("shutting down")
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	err = sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runSudoScript(cfg, "bin/timechief-shutdown")
}

func (sys System) doReboot() error {
	log.Printf("rebooting")
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	err = sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runSudoScript(cfg, "bin/timechief-reboot")
}

func (sys System) Shutdown() error {
	Lock()
	defer Unlock()
	err := sys.doShutdown()
	if err != nil {
		log.Printf("shutdown error: %v", err)
	}
	return nil
}

func (sys System) Reboot() error {
	Lock()
	defer Unlock()
	err := sys.doReboot()
	if err != nil {
		log.Printf("reboot error: %v", err)
	}
	return nil
}

var ErrNoWifi error = errors.New("no wifi card found")

func (sys System) ReadWifiCards() ([]WifiInterface, error) {
	panic("not implemented")
}

func toStoreCards(cards []WifiInterface) []*store.WifiInterface {
	storeCards := make([]*store.WifiInterface, len(cards))
	for i := 0; i < len(cards); i++ {
		card := cards[i]
		storeCard := &store.WifiInterface{
			Interface: card.Interface,
		}
		storeCards[i] = storeCard
	}
	return storeCards
}

func toStoreNetworks(nets []WifiNetwork) []*store.WifiNetwork {
	storeNets := make([]*store.WifiNetwork, len(nets))
	for i := 0; i < len(nets); i++ {
		net := nets[i]
		storeNet := &store.WifiNetwork{
			SSID:   net.SSID,
			Signal: net.Signal,
		}
		storeNets[i] = storeNet
	}
	return storeNets
}

func (sys System) WifiLoadInterfaces() error {
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	cards, err := ReadWifiInterfaces(cfg)
	if err != nil {
		return err
	}
	if len(cards) == 0 {
		return ErrNoWifi
	}
	err = sys.WifiInterfaceStore.DeleteAll()
	if err != nil {
		return err
	}

	storeCards := toStoreCards(cards)
	for i := 0; i < len(cards); i++ {
		card := storeCards[i]
		err = sys.WifiInterfaceStore.Create(card)
		if err != nil {
			return err
		}
	}

	active, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			active = *storeCards[0]
			err = sys.WifiInterfaceStore.SetActive(&active)
			if err != nil {
				return fmt.Errorf("failed to set active wifi card: %w", err)
			}
		} else {
			return fmt.Errorf("failed to get active wifi card: %w", err)
		}
	}

	log.Printf("loaded active wifi interface: %s", active.Interface)
	return nil
}

var ErrNoWifiNetworks error = errors.New("no wifi networks found")

func (sys System) WifiScan() error {
	storeIFace, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	iFace := WifiInterface{
		Interface: storeIFace.Interface,
	}
	networks, err := iFace.ScanWifiNetworks()
	if err != nil {
		return fmt.Errorf("failed to scan wifi networks: %w", err)
	}
	if len(networks) == 0 {
		return ErrNoWifiNetworks
	}
	err = sys.WifiNetworkStore.DeleteAll()
	if err != nil {
		return fmt.Errorf("failed to delete all wifi networks: %w", err)
	}
	storeNets := toStoreNetworks(networks)
	for i := 0; i < len(storeNets); i++ {
		net := storeNets[i]
		err = sys.WifiNetworkStore.Create(net)
		if err != nil {
			return fmt.Errorf("failed to create wifi network: %w", err)
		}
	}
	return nil
}

func (sys System) WifiConnect(uuid string) error {
	storeCard, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	storeNetwork, err := sys.WifiNetworkStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi network: %w", err)
	}
	card := WifiInterface{
		Interface: storeCard.Interface,
	}
	network := WifiNetwork{
		SSID: storeNetwork.SSID,
		Key:  storeNetwork.Key,
	}
	err = card.Connect(network)
	if err != nil {
		return fmt.Errorf("failed to connect to wifi network: %w", err)
	}

	err = sys.Cache.Create(uuid, time.Hour)
	if err != nil {
		return fmt.Errorf("failed to create cache entry for wifi connect status: %w", err)
	}
	return nil
}

func (sys System) WifiHotspot() error {
	storeCard, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	ssid, err := sys.KeyValueStore.Get(store.HotspotSSID)
	if err != nil {
		return fmt.Errorf("failed to get hotspot ssid: %w", err)
	}
	key, err := sys.KeyValueStore.Get(store.HotspotKey)
	if err != nil {
		return fmt.Errorf("failed to get hotspot key: %w", err)
	}
	card := WifiInterface{
		Interface: storeCard.Interface,
	}
	network := WifiNetwork{
		SSID: ssid,
		Key:  key,
	}
	return card.Hotspot(network)
}

func (sys System) LoadNetworkStatus() error {
	storeCard, err := sys.WifiInterfaceStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	card := WifiInterface{
		Interface: storeCard.Interface,
	}
	status, err := card.NetworkStatus()
	if err != nil {
		return fmt.Errorf("failed to get network status: %w", err)
	}
	err = sys.KeyValueStore.Set(store.IPAddressKey, status.IPV4Address)
	if err != nil {
		return fmt.Errorf("failed to set ip address: %w", err)
	}
	err = sys.KeyValueStore.Set(store.InterfaceModeKey, status.Mode)
	if err != nil {
		return fmt.Errorf("failed to set network mode: %w", err)
	}
	return nil
}

type internetCheck struct {
	address  string
	timeout  time.Duration
	interval time.Duration
}

func (check internetCheck) runCheck(nc netcmd.NetCmd, stopch <-chan struct{}) error {
	// Start the loop to ping the address
	// log.Printf("checking internet with address: %s", check.address)
	startTime := time.Now()
	ticker := time.NewTicker(check.interval)
	defer ticker.Stop()
	for {
		select {
		case <-stopch:
			return nil
		case <-ticker.C:
			err := nc.CheckInternet(check.address)

			if err != nil {
				log.Printf("retrying internet check after failure with address %s: %s", check.address, err)
			}
			if err == nil {
				return nil
			}

			// Check if the timeout has been reached
			elapsedTime := time.Since(startTime)
			if elapsedTime > check.timeout {
				return fmt.Errorf("timed out checking internet with address: %s", check.address)
			}
		}
	}
}

func (sys System) CheckInternet() error {
	const timeout = 15 * time.Second
	const interval = time.Second
	addresses := []string{
		"google.com",
		"facebook.com",
		"amazon.com",
		"salesforce.com",
		"gov.uk",
	}
	checks := make([]internetCheck, len(addresses))
	for i := 0; i < len(addresses); i++ {
		checks[i] = internetCheck{
			address:  addresses[i],
			timeout:  timeout,
			interval: interval,
		}
	}
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	nc := netcmd.NewNetCmd(cfg)
	// Run each check in a goroutine.
	// If any of the checks return nil, then the internet is working.
	// We can return early in this case.
	// If all of the checks fail, then the internet is not working.
	// We return an error in this case.
	resultChan := make(chan bool)
	closeChanWg := sync.WaitGroup{}
	stopChan := make(chan struct{})
	for i := 0; i < len(checks); i++ {
		closeChanWg.Add(1)
		go func(check internetCheck) {
			defer closeChanWg.Done()
			err := check.runCheck(nc, stopChan)
			resultChan <- err == nil
			if err != nil {
				log.Printf("internet check failed: %v", err)
			}
		}(checks[i])
	}
	go func() {
		closeChanWg.Wait()
		close(resultChan)
	}()
	defer close(stopChan)
	for result := range resultChan {
		if result {
			go func() {
				// Drain the channel.
				// This ensures that all goroutines exit.
				for range resultChan {
				}
			}()
			// Write internet check time to kv.
			// TODO would be nice to use time.Time in the database.
			err = sys.KeyValueStore.Set(store.LastInternetCheckKey, time.Now().Format(time.RFC3339))
			if err != nil {
				return fmt.Errorf("failed to record last internet check time: %w", err)
			}
			return nil
		}
	}

	return errors.New("all internet checks failed")
}
