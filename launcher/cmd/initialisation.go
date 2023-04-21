package cmd

import (
	"log"

	client "github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
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

	clnt, err := client.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	init := update.Initialiser{
		DB: db,
		Updater: update.Updater{
			CfgStore:          cfgStore,
			Client:            clnt,
			LaunchTargetStore: store.LaunchTargetStore{DB: db},
			VersionStore:      store.VersionStore{DB: db},
			RequestTimeout:    ctx.Duration("service-request-timeout"),
		},
	}
	if !init.IsInitialised() {
		log.Println("initialising client")
		return init.Initialise(ctx, cfg)
	}
	log.Println("already initialised, skipping initialisation")
	return nil
}
