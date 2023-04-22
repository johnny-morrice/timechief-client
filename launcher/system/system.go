package system

import (
	"errors"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"gorm.io/gorm"
)

type System struct {
	DB                 *gorm.DB
	ConfigStore        store.ConfigStore
	KeyValueStore      store.KeyValueStore
	WifiInterfaceStore store.WifiInterfaceStore
	WifiNetworkStore   store.WifiNetworkStore
}

func (sys System) stopApp() error {
	return store.CloseDB(sys.DB)
}

func (sys System) runScript(cfg store.Config, path string) error {
	root := cfg.GetInstallRoot()
	script := filepath.Join(root, path)
	output, err := exec.Command(script).CombinedOutput()
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
	return sys.runScript(cfg, "bin/timechief-shutdown")
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
	return sys.runScript(cfg, "bin/timechief-reboot")
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
			UUID: uuid.NewString(),
			SSID: net.SSID,
		}
		storeNets[i] = storeNet
	}
	return storeNets
}

func (sys System) syncWifiInterfaces() error {
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

	return nil
}

var ErrNoWifiNetworks error = errors.New("no wifi networks found")

func (sys System) SyncWifiNetworks() error {
	err := sys.syncWifiInterfaces()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
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

func (sys System) Connect() error {
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
	return card.Connect(network)
}

func (sys System) Hotspot() error {
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
