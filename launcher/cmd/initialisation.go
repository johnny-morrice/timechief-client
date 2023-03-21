package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/api"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

// Read the given configKeys from the cli.Context and return a store.Config instance.
func readConfigFromFlags(c *cli.Context, configKeys []string) store.Config {
	cfg := store.Config{
		Config: make(map[string]string),
	}
	for _, key := range configKeys {
		value := c.String(key)
		if value == "" {
			continue
		}
		cfg.Config[key] = value
	}
	return cfg
}

func cfgFlags(c *cli.Context, cfgStore store.ConfigStore) store.Config {
	configKeys := []string{"install-root", "api-base-url", "product", "stream"}
	cfg := readConfigFromFlags(c, configKeys)
	return cfg
}

func Initialise(c *cli.Context) error {
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}

	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{Db: db}
	cfg := cfgFlags(c, cfgStore)

	clnt, err := api.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	init := initialiser{
		db: db,
		updater: updater{
			cfgStore:          cfgStore,
			api:               clnt,
			launchTargetStore: store.LaunchTargetStore{Db: db},
			versionStore:      store.VersionStore{Db: db},
		},
	}
	if !init.isInitialised() {
		log.Println("initialising client")
		return init.initialise(cfg)
	}
	log.Println("already initialised, skipping initialisation")
	return nil
}

type initialiser struct {
	db *gorm.DB
	updater
}

func (init initialiser) initialise(cfg store.Config) error {
	err := store.AutoMigrate(init.db)
	if err != nil {
		return err
	}
	err = init.cfgStore.SetConfig(cfg)
	if err != nil {
		return err
	}
	err = init.firstUpdate()
	if err != nil {
		return err
	}
	log.Print("initialised client OK")
	return nil
}

func (init initialiser) isInitialised() bool {
	lt, err := init.launchTargetStore.GetActiveLaunchTarget()
	return err == nil && lt.ID != 0
}
