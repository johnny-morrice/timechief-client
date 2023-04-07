package cmd

import (
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/api"
	client "github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/daemon"
	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
	"github.com/urfave/cli/v2"
)

func Daemon(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	clnt, err := client.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	up := update.Updater{
		VersionStore:      store.VersionStore{Db: db},
		LaunchTargetStore: store.LaunchTargetStore{Db: db},
		CfgStore:          cfgStore,
		Client:            clnt,
	}

	updateDaemon := daemon.Update{
		Updater: up,
	}
	deviceDataDaemon := daemon.DeviceData{
		DeviceDataStore: store.DeviceDataStore{Db: db},
	}
	go updateDaemon.Start(ctx)
	go deviceDataDaemon.Start(ctx)

	addr := ctx.String("listen-addr")
	mux := http.NewServeMux()
	api := api.API{
		Service: service.APIService{},
	}
	api.AddRoutes(mux)
	return http.ListenAndServe(addr, mux)
}
