package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

func ReadClientConfig(cfg store.Config) (ClientConfig, error) {
	installRoot := cfg.GetInstallRoot()
	clientConfigPath := filepath.Join(installRoot, "client-config.json")
	file, err := os.Open(clientConfigPath)

	if errors.Is(err, os.ErrNotExist) {
		log.Printf("no client config found at: %s", clientConfigPath)
		return ClientConfig{}, nil
	}

	if err != nil {
		return ClientConfig{}, err
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("error closing client config file: %s", err)
		}
	}()

	decoder := json.NewDecoder(file)
	var clientConfig ClientConfig
	err = decoder.Decode(&clientConfig)
	if err != nil {
		return ClientConfig{}, fmt.Errorf("error decoding client config: %w", err)
	}
	if clientConfig.Env == nil {
		clientConfig.Env = make(map[string]string)
	}

	return clientConfig, nil
}

type ClientConfig struct {
	Env map[string]string
}

func (clientCfg ClientConfig) ExportEnv() error {
	log.Printf("exporting %d env vars", len(clientCfg.Env))
	for key, value := range clientCfg.Env {
		err := os.Setenv(key, value)
		if err != nil {
			return fmt.Errorf("error setting env var %s: %w", key, err)
		}
	}
	return nil
}
