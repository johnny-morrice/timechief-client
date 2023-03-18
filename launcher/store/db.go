package store

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func getGormConfig() *gorm.Config {
	return &gorm.Config{}
}

// GetDBConnection gets a GORM database connection for a SQLite3 database.
func GetDBConnection() (*gorm.DB, error) {
	return gorm.Open(sqlite.Open("/opt/timechief-launcher/timechief-launcher.db"), getGormConfig())
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&LaunchTarget{}, &ConfigEntry{}, &Version{})
}
