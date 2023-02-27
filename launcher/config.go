package main

import (
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ConfigEntry struct {
	gorm.Model
	Key   string
	Value string
}

type Config struct {
	Config map[string]string
}

type ConfigStore struct {
	db *gorm.DB
}

func (store ConfigStore) GetConfig() (Config, error) {
	var configEntries []ConfigEntry
	result := store.db.Find(&configEntries)
	if result.Error != nil {
		return Config{}, result.Error
	}
	config := make(map[string]string)
	for _, entry := range configEntries {
		config[entry.Key] = entry.Value
	}
	return Config{config}, nil
}

const defaultInstallRoot = "/opt/timechief-launcher"
const defaultArtifactURL = "https://timechief.io"
const defaultProduct = "timechief-rpi"
const defaultStream = "production"

func (cfg Config) NewInstallPath(version string) string {
	return filepath.Join(cfg.GetInstallRoot(), cfg.GetProduct(), cfg.GetStream(), version, uuid.NewString())
}

func (cfg Config) GetInstallRoot() string {
	root, ok := cfg.Config["installRoot"]
	if !ok {
		return defaultInstallRoot
	}
	return root
}

func (cfg Config) GetArtifactURL() string {
	url, ok := cfg.Config["artifactURL"]
	if !ok {
		return defaultArtifactURL
	}
	return url
}

func (cfg Config) GetProduct() string {
	product, ok := cfg.Config["product"]
	if !ok {
		return defaultProduct
	}
	return product
}

func (cfg Config) GetStream() string {
	stream, ok := cfg.Config["stream"]
	if !ok {
		return defaultStream
	}
	return stream
}
