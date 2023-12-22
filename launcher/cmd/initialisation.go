package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/clientbuilder"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/update"
	"github.com/urfave/cli/v2"
)

// Read the given configKeys from the cli.Context and return a store.Config instance.
func cfgFlags(ctx *cli.Context) store.Config {
	configKeys := []string{"install-root", "api-base-url", "product", "stream", "device-credentials"}
	cfg := store.Config{
		Config: make(map[string]string),
	}
	for _, key := range configKeys {
		value := ctx.String(key)
		if value == "" {
			continue
		}
		cfg.Config[key] = value
	}
	return cfg
}

func Initialise(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}

	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{DB: db}
	cfg := cfgFlags(ctx)

	noAuthClient, err := clientbuilder.Builder{}.CfgStore(cfgStore).KVStore(store.KeyValueStore{DB: db}).UseAuth(false).Build()
	if err != nil {
		return err
	}

	init := update.Initialiser{
		DB:            db,
		KeyValueStore: store.KeyValueStore{DB: db},
		Updater:       update.MakeUpdater(cfgStore, store.VersionStore{DB: db}, store.LaunchTargetStore{DB: db}, noAuthClient, ctx.Duration("service-request-timeout")),
	}
	if !init.IsInitialised() {
		log.Println("initialising client")
		return init.Initialise(ctx, cfg)
	}
	log.Println("already initialised, skipping initialisation")
	return nil
}
