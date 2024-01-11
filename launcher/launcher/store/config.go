package store

import (
	"fmt"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ConfigEntry struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Key       string `gorm:"uniqueIndex"`
	Value     string
}

type Config struct {
	Config map[string]string
}

type ConfigStore struct {
	DB *gorm.DB
}

func (store ConfigStore) SetConfig(cfg Config) error {
	for key, value := range cfg.Config {
		entry := ConfigEntry{Key: key, Value: value}
		// Update existing entry or create new entry.
		result := store.DB.Where("key = ?", key).Assign(entry).FirstOrCreate(&entry)
		if result.Error != nil {
			return result.Error
		}
	}
	// Delete all other entries that do not have keys in cfg.
	keys := make([]string, 0, len(cfg.Config))
	for key := range cfg.Config {
		keys = append(keys, key)
	}
	result := store.DB.Where("key NOT IN ?", keys).Delete(&ConfigEntry{})
	return result.Error
}

func (store ConfigStore) GetConfig() (Config, error) {
	var configEntries []ConfigEntry
	result := store.DB.Find(&configEntries)
	if result.Error != nil {
		return Config{}, result.Error
	}
	config := make(map[string]string)
	for _, entry := range configEntries {
		config[entry.Key] = entry.Value
	}
	return Config{config}, nil
}

const DefaultInstallRoot = "/opt/timechief-launcher"
const DefaultBaseURL = "https://timechief.io/api/v1"
const DefaultProduct = "timechief-rpi"
const DefaultStream = "production"

func (cfg Config) NewInstallPath(version string) string {
	return filepath.Join(cfg.GetInstallRoot(), cfg.GetProduct(), cfg.GetStream(), version, uuid.NewString())
}

func (cfg Config) Merge(other Config) Config {
	newCfg := Config{Config: make(map[string]string)}
	for key, value := range cfg.Config {
		newCfg.Config[key] = value
	}
	for key, value := range other.Config {
		newCfg.Config[key] = value
	}
	return newCfg
}

func (cfg Config) GetAuthZeroBaseURL() (string, error) {
	baseURL, ok := cfg.Config["auth0-base-url"]
	if !ok {
		return "", fmt.Errorf("auth0-base-url not found: %w", ErrCfgNotFound)
	}
	return baseURL, nil
}

func (cfg Config) GetAuthZeroClientID() (string, error) {
	clientID, ok := cfg.Config["auth0-client-id"]
	if !ok {
		return "", fmt.Errorf("auth0-client-id not found: %w", ErrCfgNotFound)
	}
	return clientID, nil
}

func (cfg Config) GetAuthZeroAudience() (string, error) {
	audience, ok := cfg.Config["auth0-audience"]
	if !ok {
		return "", fmt.Errorf("auth0-audience not found: %w", ErrCfgNotFound)
	}
	return audience, nil
}

func (cfg Config) GetInstallRoot() string {
	root, ok := cfg.Config["install-root"]
	if !ok {
		return DefaultInstallRoot
	}
	return root
}

func (cfg Config) GetAPIBaseURL() string {
	url, ok := cfg.Config["api-base-url"]
	if !ok {
		return DefaultBaseURL
	}
	return url
}

var ErrCfgNotFound = fmt.Errorf("config item not found")

func (cfg Config) GetProduct() string {
	product, ok := cfg.Config["product"]
	if !ok {
		return DefaultProduct
	}
	return product
}

func (cfg Config) GetStream() string {
	stream, ok := cfg.Config["stream"]
	if !ok {
		return DefaultStream
	}
	return stream
}

func (cfg Config) GetBundleToken() string {
	return cfg.Config["bundle-token"]
}

func (cfg Config) GetClientLogFilePath() string {
	return filepath.Join(cfg.GetInstallRoot(), "logs", "timechief-client")
}
