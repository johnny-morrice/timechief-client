package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"gorm.io/gorm"
)

type DeviceData struct {
	ID         uint `gorm:"primarykey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeviceJSON []byte
}

type DeviceDataStore struct {
	DB *gorm.DB
}

func (store DeviceDataStore) GetDeviceData() (v2.Data, error) {
	var data DeviceData
	result := store.DB.First(&data)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return v2.Data{}, nil
		}
		return v2.Data{}, fmt.Errorf("error getting cached device data: %w", result.Error)
	}
	var deviceData v2.Data
	err := json.Unmarshal(data.DeviceJSON, &deviceData)
	if err != nil {
		return v2.Data{}, fmt.Errorf("error unmarshaling device data: %w", err)
	}
	return deviceData, nil
}

func (store DeviceDataStore) SetDeviceData(clockData v2.Data) error {
	deviceJSON, err := json.Marshal(clockData)
	if err != nil {
		return fmt.Errorf("error marshaling device data: %w", err)
	}
	var data DeviceData
	data.DeviceJSON = deviceJSON
	result := store.DB.Save(&data)
	if result.Error != nil {
		return fmt.Errorf("error saving device data: %w", result.Error)
	}
	// Delete all entries except the most recent
	result = store.DB.Where("id != ?", data.ID).Delete(&DeviceData{})
	if result.Error != nil {
		return fmt.Errorf("error deleting old device data: %w", result.Error)
	}
	return nil
}
