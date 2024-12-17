package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/clientbuilder"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/versiondownload"
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

	keyValueStore := store.KeyValueStore{DB: db}
	noAuthClientFactory := func() (v2.ClientInterface, error) {
		return clientbuilder.Builder{}.CfgStore(cfgStore).KVStore(keyValueStore).UseAuth(false).Build()
	}

	versionDownloader := versiondownload.MakeVersionDownloader(cfgStore, noAuthClientFactory)

	updater := update.MakeUpdater(cfgStore, store.VersionStore{DB: db}, store.LaunchTargetStore{DB: db}, versionDownloader, noAuthClientFactory, ctx.Duration("service-request-timeout"))

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
