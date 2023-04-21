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
	DB               *gorm.DB
	ConfigStore      store.ConfigStore
	WifiCardStore    store.WifiCardStore
	WifiNetworkStore store.WifiNetworkStore
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

func (sys System) ReadWifiCards() ([]WifiCard, error) {
	panic("not implemented")
}

func toStoreCards(cards []WifiCard) []*store.WifiCard {
	storeCards := make([]*store.WifiCard, len(cards))
	for i := 0; i < len(cards); i++ {
		card := cards[i]
		storeCard := &store.WifiCard{
			MAC: card.MAC,
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
			UUID:  uuid.NewString(),
			ESSID: net.ESSID,
			BSSID: net.BSSID,
		}
		storeNets[i] = storeNet
	}
	return storeNets
}

func (sys System) GetActiveWifiCard() (WifiCard, error) {
	cards, err := sys.ReadWifiCards()
	if err != nil {
		return WifiCard{}, err
	}
	if len(cards) == 0 {
		return WifiCard{}, ErrNoWifi
	}
	storeCards := toStoreCards(cards)
	for i := 0; i < len(cards); i++ {
		card := storeCards[i]
		err = sys.WifiCardStore.CreateIfNotExists(card)
		if err != nil {
			return WifiCard{}, err
		}
	}

	active, err := sys.WifiCardStore.GetActive()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			active = *storeCards[0]
			err = sys.WifiCardStore.SetActive(&active)
			if err != nil {
				return WifiCard{}, fmt.Errorf("failed to set active wifi card: %w", err)
			}
		} else {
			return WifiCard{}, fmt.Errorf("failed to get active wifi card: %w", err)
		}
	}

	card := WifiCard{
		MAC: active.MAC,
	}
	return card, nil
}

var ErrNoWifiNetworks error = errors.New("no wifi networks found")

func (sys System) SyncWifiNetworks() error {
	card, err := sys.GetActiveWifiCard()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}
	networks, err := card.ScanWifiNetworks()
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

type WifiCard struct {
	MAC string
}

func (sys WifiCard) ScanWifiNetworks() ([]WifiNetwork, error) {
	panic("not implemented")
}

type WifiNetwork struct {
	ESSID string
	BSSID string
}
