package store

import (
	"path/filepath"

	"github.com/urfave/cli/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func getGormConfig() *gorm.Config {
	return &gorm.Config{}
}

// GetDBConnection gets a GORM database connection for a SQLite3 database.
func GetDBConnection(ctx *cli.Context) (*gorm.DB, error) {
	installRoot := ctx.String("install-root")
	dbPath := filepath.Join(installRoot, "timechief-launcher.db")
	return gorm.Open(sqlite.Open(dbPath), getGormConfig())
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&LaunchTarget{}, &ConfigEntry{}, &Version{})
}

func CloseDB(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
