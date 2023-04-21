package store

import (
	"encoding/json"
	"fmt"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"gorm.io/gorm"
)

type DeviceData struct {
	gorm.Model
	DeviceJSON []byte
}

type DeviceDataStore struct {
	DB *gorm.DB
}

func (store DeviceDataStore) GetDeviceData() (viewmodel.ClockData, error) {
	var data DeviceData
	result := store.DB.First(&data)
	if result.Error != nil {
		return viewmodel.ClockData{}, fmt.Errorf("error getting cached device data: %w", result.Error)
	}
	var deviceData viewmodel.ClockData
	err := json.Unmarshal(data.DeviceJSON, &deviceData)
	if err != nil {
		return viewmodel.ClockData{}, fmt.Errorf("error unmarshaling device data: %w", err)
	}
	return deviceData, nil
}

func (store DeviceDataStore) SetDeviceData(clockData viewmodel.ClockData) error {
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
