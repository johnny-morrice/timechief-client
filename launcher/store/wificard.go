package store

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type WifiCard struct {
	ID          uint `gorm:"primarykey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	AdapterName string `gorm:"uniqueIndex"`
	Active      bool
}

type WifiCardStore struct {
	DB *gorm.DB
}

// CreateIfNotExists creates a new WIFI card in the store.
func (store WifiCardStore) Create(card *WifiCard) error {
	err := store.DB.Create(card).Error
	if err != nil {
		return fmt.Errorf("failed to create WIFI network: %w", err)
	}
	return nil
}

// SetActive sets the active flag of a WIFI card to true, and sets all other cards to false.
func (store WifiCardStore) SetActive(card *WifiCard) error {
	if card.ID == 0 {
		return fmt.Errorf("cannot activate WIFI card with ID 0")
	}
	// Deactivate all other WIFI cards
	result := store.DB.Model(&WifiCard{}).Where("active = ?", true).Update("active", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the card
	result = store.DB.Model(&card).Where("id = ?", card.ID).Update("active", true)
	if result.Error != nil {
		return result.Error
	}
	// Hack to update the card in memory
	card.Active = true
	return nil
}

// GetActive returns the active WIFI card.
func (store WifiCardStore) GetActive() (WifiCard, error) {
	var card WifiCard
	result := store.DB.Where("active = ?", true).First(&card)
	if result.Error != nil {
		return WifiCard{}, result.Error
	}
	return card, nil
}

// DeleteAll deletes all wifi cards from the store.
func (store WifiCardStore) DeleteAll() error {
	result := store.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&WifiCard{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}
