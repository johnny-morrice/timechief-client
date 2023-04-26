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
	Active    bool
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

// SetActive sets the active flag of a WIFI network to true, and sets all other networks to false.
func (store WifiNetworkStore) SetActive(network *WifiNetwork) error {
	if network.ID == 0 {
		return fmt.Errorf("cannot activate WIFI network with ID 0")
	}
	// Deactivate all other WIFI networks
	result := store.DB.Model(&WifiNetwork{}).Where("active = ?", true).Update("active", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the network
	result = store.DB.Model(&network).Where("id = ?", network.ID).Update("active", true)
	if result.Error != nil {
		return result.Error
	}
	// Hack to update the network in memory
	network.Active = true
	return nil
}

// GetActive returns the active WIFI network.
func (store WifiNetworkStore) GetActive() (WifiNetwork, error) {
	var network WifiNetwork
	result := store.DB.Where("active = ?", true).First(&network)
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
