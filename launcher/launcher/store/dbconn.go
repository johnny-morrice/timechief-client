//go:build !windows

package store

import (
	"fmt"
	"path/filepath"

	"github.com/urfave/cli/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// GetDBConnection gets a GORM database connection for a SQLite3 database.
func GetDBConnection(ctx *cli.Context) (*gorm.DB, error) {
	installRoot := ctx.String("install-root")
	dbPath := filepath.Join(installRoot, "timechief-launcher.db")
	dialect := sqlite.Open(dbPath)
	db, err := gorm.Open(dialect, getGormConfig())
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database at %s: %w", dbPath, err)
	}
	err = db.Exec("PRAGMA synchronous = FULL;").Error
	if err != nil {
		return nil, err
	}
	return db, nil
}
