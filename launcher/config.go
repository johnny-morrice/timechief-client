package main

import "gorm.io/gorm"

type ConfigEntry struct {
	gorm.Model
	Key   string
	Value string
}

func GetConfigEntries(db *gorm.DB) ([]ConfigEntry, error) {
	var configEntries []ConfigEntry
	result := db.Find(&configEntries)
	return configEntries, result.Error
}

type Config struct {
	Config map[string]string
}

func GetConfig(db *gorm.DB) (Config, error) {
	configEntries, err := GetConfigEntries(db)
	if err != nil {
		return Config{}, err
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
