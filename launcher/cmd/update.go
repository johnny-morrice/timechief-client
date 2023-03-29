package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/client"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

func Update(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}

	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{Db: db}
	flagCfg := cfgFlags(ctx)

	cfg, err := cfgStore.GetConfig()

	if err != nil {
		return err
	}

	cfg = cfg.Merge(flagCfg)
	cfgStore.SetConfig(cfg)

	clnt, err := client.MakePublicClient(cfg)
	if err != nil {
		return err
	}

	updater := updater{
		cfgStore:          cfgStore,
		api:               clnt,
		launchTargetStore: store.LaunchTargetStore{Db: db},
		versionStore:      store.VersionStore{Db: db},
	}

	init := initialiser{
		db:      db,
		updater: updater,
	}
	if !init.isInitialised() {
		log.Println("initialising client")
		return init.initialise(ctx, cfg)
	}

	log.Println("updating client")
	return updater.update(ctx)
}
