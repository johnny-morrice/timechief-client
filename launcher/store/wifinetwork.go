package store

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type WifiNetwork struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	SSID      string `gorm:"column:ssid"`
	Signal    int
	Key       string
	Selected  bool
	Ready     bool
}

type WifiNetworkStore struct {
	DB *gorm.DB
}

// Create creates a new WIFI network in the store.
func (store WifiNetworkStore) Create(network *WifiNetwork) error {
	err := store.DB.Create(network).Error
	if err != nil {
		return fmt.Errorf("failed to create WIFI network: %w", err)
	}
	return nil
}

// SelectNetwork sets the active flag of a WIFI network to true, and sets all other networks to false.
func (store WifiNetworkStore) SelectNetwork(ssid, key string) error {
	// Set the wifi key.
	err := store.DB.Model(&WifiNetwork{}).Where("ssid = ?", ssid).Update("key", key).Error
	if err != nil {
		return fmt.Errorf("failed to set WIFI key: %w", err)
	}

	// Deactivate all other WIFI networks
	result := store.DB.Model(&WifiNetwork{}).Where("selected = ?", true).Update("selected", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the network
	result = store.DB.Model(&WifiNetwork{}).Where("ssid = ?", ssid).Update("selected", true)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("failed to set active WIFI network %s: %w", ssid, gorm.ErrRecordNotFound)
	}
	result = store.DB.Model(&WifiNetwork{}).Where("ssid = ?", ssid).Update("ready", true)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("failed to set active WIFI network %s: %w", ssid, gorm.ErrRecordNotFound)
	}
	return nil
}

func (store WifiNetworkStore) MarkSelectedReady() error {
	result := store.DB.Model(&WifiNetwork{}).Where("selected = ?", true).Update("ready", true)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (store WifiNetworkStore) MarkNotReady() error {
	result := store.DB.Model(&WifiNetwork{}).Where("ready = ?", true).Update("ready", false)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (store WifiNetworkStore) DeselectNetwork() error {
	result := store.DB.Model(&WifiNetwork{}).Where("selected = ?", true).Update("selected", false)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

// GetActive returns the active WIFI network.
func (store WifiNetworkStore) GetActive() (WifiNetwork, error) {
	var network WifiNetwork
	result := store.DB.Where("selected = ?", true).Where("ready = ?", true).First(&network)
	if result.Error != nil {
		return WifiNetwork{}, result.Error
	}
	return network, nil
}

// List returns all WIFI networks in the store, sorted by ESSID, BSSID, and UUID.
func (store WifiNetworkStore) List() ([]WifiNetwork, error) {
	var networks []WifiNetwork
	result := store.DB.Order("signal, ssid").Find(&networks)
	if result.Error != nil {
		return []WifiNetwork{}, result.Error
	}
	return networks, nil
}

// DeleteAll deletes all WIFI networks from the store.
func (store WifiNetworkStore) DeleteAll() error {
	result := store.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&WifiNetwork{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}
