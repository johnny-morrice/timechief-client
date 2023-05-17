package store

import (
	"log"
	"os"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func getGormConfig() *gorm.Config {
	logger := logger.New(
		log.New(os.Stderr, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second,   // Slow SQL threshold
			LogLevel:                  logger.Silent, // Log level
			IgnoreRecordNotFoundError: true,          // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      false,         // Don't include params in the SQL log
			Colorful:                  false,         // Disable color
		},
	)
	return &gorm.Config{Logger: logger}
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&LaunchTarget{}, &ConfigEntry{}, &Version{}, &StateFlag{}, &DeviceData{}, &KeyValue{}, &WifiInterface{}, &WifiNetwork{}, &CacheEntry{})
}

func CloseDB(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
