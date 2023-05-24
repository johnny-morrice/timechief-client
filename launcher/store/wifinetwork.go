package store

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type WifiNetwork struct {
	ID            uint `gorm:"primarykey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	SSID          string `gorm:"uniqueIndex,column:ssid"`
	Signal        int
	Key           string
	Selected      bool
	Ready         bool
	FoundLastScan bool
}

type WifiNetworkStore struct {
	DB *gorm.DB
}

// Save creates a new WIFI network if not already in database, and updates signal strength otherwise.
func (store WifiNetworkStore) Save(network *WifiNetwork) error {
	network.FoundLastScan = true
	// Check if network already exists
	var existing WifiNetwork

	result := store.DB.Where("ssid = ?", network.SSID).First(&existing)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Create new network
			err := store.DB.Create(network).Error
			if err != nil {
				return fmt.Errorf("failed to create WIFI network: %w", err)
			}
		}
		return result.Error
	}
	// Update signal strength
	result = store.DB.Model(&WifiNetwork{}).Where("ssid = ?", network.SSID).Update("signal", network.Signal)
	if result.Error != nil {
		return result.Error
	}
	result = store.DB.Model(&WifiNetwork{}).Where("ssid = ?", network.SSID).Update("found_last_scan", true)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (store WifiNetworkStore) MarkAllNotFound() error {
	result := store.DB.Model(&WifiNetwork{}).Session(&gorm.Session{AllowGlobalUpdate: true}).Update("found_last_scan", false)
	if result.Error != nil {
		return result.Error
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
	result := store.DB.Model(&WifiNetwork{}).Session(&gorm.Session{AllowGlobalUpdate: true}).Update("selected", false)
	if result.Error != nil {
		return result.Error
	}
	result = store.DB.Model(&WifiNetwork{}).Session(&gorm.Session{AllowGlobalUpdate: true}).Update("ready", false)
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
	result := store.DB.Where("found_last_scan = ?", true).Order("signal, ssid").Find(&networks)
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
