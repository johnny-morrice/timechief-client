package system

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system/netcmd"
	"gorm.io/gorm"
)

type System struct {
	DB                 *gorm.DB
	ConfigStore        store.ConfigStore
	KeyValueStore      store.KeyValueStore
	StateFlagStore     store.StateFlagStore
	WifiInterfaceStore store.WifiInterfaceStore
	WifiNetworkStore   store.WifiNetworkStore
}

func (sys System) stopApp() error {
	return store.CloseDB(sys.DB)
}

func (sys System) runScript(cfg store.Config, path string, args ...string) error {
	root := cfg.GetInstallRoot()
	binRoot := filepath.Join(root, "bin")
	script := filepath.Join(binRoot, path)
	args = append([]string{script}, args...)
	cmd := exec.Cmd{
		Path: script,
		Dir:  binRoot,
		Args: args,
	}

	output, err := cmd.CombinedOutput()
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
	return sys.runScript(cfg, "timechief-shutdown")
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
	return sys.runScript(cfg, "timechief-reboot")
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
	dedupe := make(map[string]int, len(nets))

	for i := 0; i < len(nets); i++ {
		net := nets[i]
		signal, ok := dedupe[net.SSID]
		if ok {
			if net.Signal < signal {
				continue
			}
		}
		dedupe[net.SSID] = net.Signal
	}

	storeNets := make([]*store.WifiNetwork, 0, len(dedupe))
	for ssid, signal := range dedupe {
		storeNet := &store.WifiNetwork{
			SSID:   ssid,
			Signal: signal,
		}
		storeNets = append(storeNets, storeNet)
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
	log.Println("scanning wifi networks")
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
	err = sys.WifiNetworkStore.MarkAllNotFound()
	if err != nil {
		return fmt.Errorf("failed to delete all wifi networks: %w", err)
	}
	storeNets := toStoreNetworks(networks)
	for i := 0; i < len(storeNets); i++ {
		net := storeNets[i]
		err = sys.WifiNetworkStore.Save(net)
		if err != nil {
			return fmt.Errorf("failed to create wifi network: %w", err)
		}
	}
	return nil
}

func (sys System) WifiConnect() error {
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

	if err != nil {
		log.Printf("failed to connect to wifi network: %s", network.SSID)
		err = sys.WifiNetworkStore.MarkConnectionFailure(network.SSID)
		if err != nil {
			return fmt.Errorf("failed to mark wifi network as not found: %w", err)
		}
	}

	return nil
}

func randomNum() string {
	suffix := rand.Int31n(899999) + 100000
	return fmt.Sprintf("%d", suffix)
}

func generateHotspotSSID() string {
	return "timechief" + randomNum()
}

func generateHotspotKey() string {
	return "tc" + randomNum()
}

type hotspotCredentials struct {
	SSID string
	Key  string
}

func (sys System) getHotspotCredentials() (hotspotCredentials, error) {
	var ssid string
	var key string
	ssid, err := sys.KeyValueStore.Get(store.HotspotSSID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ssid = generateHotspotSSID()
		key = generateHotspotKey()
		err = sys.KeyValueStore.Set(store.HotspotSSID, ssid)
		if err != nil {
			return hotspotCredentials{}, err
		}

		err = sys.KeyValueStore.Set(store.HotspotKey, key)
		if err != nil {
			return hotspotCredentials{}, err
		}
		return hotspotCredentials{SSID: ssid, Key: key}, nil
	}

	if err != nil {
		return hotspotCredentials{}, fmt.Errorf("failed to get hotspot ssid: %w", err)
	}
	key, err = sys.KeyValueStore.Get(store.HotspotKey)
	if err != nil {
		return hotspotCredentials{}, fmt.Errorf("failed to get hotspot key: %w", err)
	}

	return hotspotCredentials{SSID: ssid, Key: key}, nil
}

func (sys System) WifiHotspot() error {
	storeCard, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	credentials, err := sys.getHotspotCredentials()
	if err != nil {
		return fmt.Errorf("failed to get hotspot credentials: %w", err)
	}
	card := WifiInterface{
		Interface: storeCard.Interface,
	}
	network := WifiNetwork{
		SSID: credentials.SSID,
		Key:  credentials.Key,
	}
	return card.Hotspot(network)
}

func (sys System) activeCardNetworkStatus() (NetworkStatus, error) {
	storeCard, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		log.Println("cannot load network status, no active wifi card")
		return NetworkStatus{}, fmt.Errorf("failed to get active wifi card: %w", err)
	}
	card := WifiInterface{
		Interface: storeCard.Interface,
	}
	return card.NetworkStatus()
}

func (sys System) LoadNetworkStatus() error {
	status, err := sys.activeCardNetworkStatus()
	if err != nil {
		return fmt.Errorf("failed to load network status: %w", err)
	}
	log.Printf("network status: %v", status)
	if status.Mode == InfraMode && status.SSID != "" {
		if status.State == "up" {
			log.Printf("connected to %s", status.SSID)
			err = sys.WifiNetworkStore.MarkConnectionSuccess(status.SSID)
			if err != nil {
				return fmt.Errorf("failed to mark wifi network as connected: %w", err)
			}
			err = sys.StateFlagStore.Delete("wifi-error")
			if err != nil {
				return fmt.Errorf("failed to delete wifi error flag: %w", err)
			}
		} else {
			log.Printf("not connected to %s", status.SSID)
			err = sys.WifiNetworkStore.MarkConnectionFailure(status.SSID)
			if err != nil {
				return fmt.Errorf("failed to mark wifi network as disconnected: %w", err)
			}
			err = sys.StateFlagStore.CreateIfNotExists("wifi-error")
			if err != nil {
				return fmt.Errorf("failed to create wifi error flag: %w", err)
			}
		}
	}
	if status.IPV4Address == "" {
		return fmt.Errorf("cannot load network status, no ip address found for %s", status.Device)
	}
	oldIpAddress, err := sys.KeyValueStore.Get(store.IPAddressKey)
	if err != nil {
		if oldIpAddress != status.IPV4Address {
			log.Printf("ip address changed from %v to %v", oldIpAddress, status.IPV4Address)
		}
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
	// Check network status
	status, err := sys.activeCardNetworkStatus()
	if err != nil {
		return fmt.Errorf("failed to load network status: %w", err)
	}

	if status.Mode != InfraMode {
		// log.Printf("not checking internet, network mode is %s", status.Mode)
		return nil
	}
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

// SyncRTC syncs the system clock with the RTC.  By running the following command:
// bin/secure/pyrtc timesync --type rv3028
func (sys System) SyncRTC() error {
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	return sys.runScript(cfg, "sudo", "secure/pyrtc", "timesync", "--type", "rv3028")
}
