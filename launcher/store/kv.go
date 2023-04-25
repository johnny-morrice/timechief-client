package store

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type KeyValue struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Key       string `gorm:"uniqueIndex"`
	Value     string
}

type KeyValueStore struct {
	DB *gorm.DB
}

const PairingCodeKey = "pairing-code"
const AccessTokenKey = "access-token"
const HotspotSSID = "hotspot-ssid"
const HotspotKey = "hotspot-key"
const IPAddressKey = "ip-address"
const InterfaceModeKey = "interface-mode"

// Set a key-value pair in the store.
func (store KeyValueStore) Set(key string, value string) error {
	entry := KeyValue{Key: key, Value: value}
	// Update existing entry or create new entry.
	err := store.DB.Where("key = ?", key).Assign(entry).FirstOrCreate(&entry).Error
	if err != nil {
		return fmt.Errorf("failed to set key-value pair: %w", err)
	}
	return nil
}

// Get a value from the store.
func (store KeyValueStore) Get(key string) (string, error) {
	var entry KeyValue
	err := store.DB.Where("key = ?", key).First(&entry).Error
	if err != nil {
		return "", fmt.Errorf("failed to get key-value pair: %w", err)
	}
	return entry.Value, nil
}

// Exists returns true if the key exists in the store.
func (store KeyValueStore) Exists(key string) (bool, error) {
	var entry KeyValue
	err := store.DB.Where("key = ?", key).First(&entry).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check key-value pair existence: %w", err)
	}
	return true, nil
}

// Delete a key-value pair from the store.
func (store KeyValueStore) Delete(key string) error {
	err := store.DB.Where("key = ?", key).Delete(&KeyValue{}).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to delete key-value pair: %w", err)
	}
	return nil
}
