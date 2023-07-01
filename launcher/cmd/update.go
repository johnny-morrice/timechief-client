package cmd

import (
	"log"

	client "github.com/johnny-morrice/timechief-client/launcher/launcher/client/serviceclient"
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

	clnt, err := client.MakePublicClient(cfg)
	if err != nil {
		return err
	}

	updater := update.Updater{
		CfgStore:          cfgStore,
		Client:            clnt,
		LaunchTargetStore: store.LaunchTargetStore{DB: db},
		VersionStore:      store.VersionStore{DB: db},
		RequestTimeout:    ctx.Duration("service-request-timeout"),
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
