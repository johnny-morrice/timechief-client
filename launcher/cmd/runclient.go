package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

func RunClient(c *cli.Context) error {
	standalone := c.Bool("standalone")
	if !standalone {
		panic("not implemented")
	}
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	ltStore := store.LaunchTargetStore{Db: db}
	launchTarget, err := ltStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}

	clientConfig, err := readClientConfig(cfg)
	if err != nil {
		return err
	}

	err = clientConfig.ExportEnv()
	if err != nil {
		return err
	}

	// TODO rollback if launch fails.
	return launchTarget.Run(cfg)
}

func readClientConfig(cfg store.Config) (ClientConfig, error) {
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
