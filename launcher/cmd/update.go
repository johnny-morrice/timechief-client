package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/client"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
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

	updater := update.Updater{
		CfgStore:          cfgStore,
		Client:            clnt,
		LaunchTargetStore: store.LaunchTargetStore{Db: db},
		VersionStore:      store.VersionStore{Db: db},
	}

	init := update.Initialiser{
		DB:      db,
		Updater: updater,
	}
	if !init.IsInitialised() {
		log.Println("initialising client")
		return init.Initialise(ctx, cfg)
	}

	log.Println("updating client")
	return updater.Update(ctx)
}
