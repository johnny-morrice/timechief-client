package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/clientbuilder"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/update"
	"github.com/urfave/cli/v2"
)

func Update(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}

	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{DB: db}

	cfg, err := cfgStore.GetConfig()

	if err != nil {
		return err
	}

	noAuthClient, err := clientbuilder.Builder{}.CfgStore(cfgStore).KVStore(store.KeyValueStore{DB: db}).UseAuth(false).Build()
	if err != nil {
		return err
	}

	versionDownloader := service.MakeVersionDownloader(cfgStore, noAuthClient)

	updater := update.MakeUpdater(cfgStore, store.VersionStore{DB: db}, store.LaunchTargetStore{DB: db}, versionDownloader, noAuthClient, ctx.Duration("service-request-timeout"))

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
