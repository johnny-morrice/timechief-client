package cmd

import (
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/api"
	client "github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/daemon"
	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/johnny-morrice/timechief-client/launcher/update"
	"github.com/urfave/cli/v2"
)

func Daemon(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}
	defer store.CloseDB(db)

	isAutoMigrate := ctx.Bool("auto-migrate")
	if isAutoMigrate {
		err = store.AutoMigrate(db)
		if err != nil {
			return err
		}
	}

	flagStore := store.StateFlagStore{Db: db}

	isClearState := ctx.Bool("clear-state")
	if isClearState {
		err = flagStore.DeleteAll()
		if err != nil {
			return err
		}
	}

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
		RequestTimeout:    ctx.Duration("service-request-timeout"),
	}

	updateDaemon := daemon.Update{
		Updater:               up,
		StateFlagStore:        flagStore,
		VersionUpdateInterval: ctx.Duration("version-update-interval"),
	}
	deviceDataDaemon := daemon.DeviceData{
		StateFlagStore:  flagStore,
		DeviceDataStore: store.DeviceDataStore{Db: db},
		CfgStore:        cfgStore,
		RequestTimeout:  ctx.Duration("service-request-timeout"),
		RefreshInterval: ctx.Duration("service-refresh-interval"),
	}
	pairingDaemon := daemon.Pairing{
		ConfigStore:          cfgStore,
		StateFlagStore:       flagStore,
		PairingCheckInterval: ctx.Duration("pairing-check-interval"),
		RequestTimeout:       ctx.Duration("service-request-timeout"),
	}

	go updateDaemon.Start(ctx)
	go deviceDataDaemon.Start(ctx)
	go pairingDaemon.Start(ctx)

	addr := ctx.String("listen-addr")
	mux := http.NewServeMux()
	api := api.API{
		Service: service.APIService{
			DeviceDataStore:   store.DeviceDataStore{Db: db},
			LaunchTargetStore: store.LaunchTargetStore{Db: db},
			StateFlagStore:    store.StateFlagStore{Db: db},
			CfgStore:          cfgStore,
			System: system.System{
				DB:          db,
				ConfigStore: cfgStore,
			},
		},
	}
	api.AddRoutes(mux)
	return http.ListenAndServe(addr, mux)
}
