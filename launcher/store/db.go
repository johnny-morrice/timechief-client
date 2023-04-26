package store

import (
	"gorm.io/gorm"
)

func getGormConfig() *gorm.Config {
	return &gorm.Config{}
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&LaunchTarget{}, &ConfigEntry{}, &Version{}, &StateFlag{}, &DeviceData{}, &KeyValue{}, &WifiInterface{}, &WifiNetwork{})
}

func CloseDB(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
