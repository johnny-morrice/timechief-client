package main

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func getGormConfig() *gorm.Config {
	return &gorm.Config{}
}

// getDBConnection gets a GORM database connection for a SQLite3 database.
func getDBConnection() (*gorm.DB, error) {
	return gorm.Open(sqlite.Open("timechief-launcher.db"), getGormConfig())
}

func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&LaunchTarget{}, &ConfigEntry{}, &Version{})
}
