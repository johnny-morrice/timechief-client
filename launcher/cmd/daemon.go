package cmd

import (
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/api"
	client "github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/daemon"
	"github.com/johnny-morrice/timechief-client/launcher/fileserver"
	"github.com/johnny-morrice/timechief-client/launcher/service/data"
	"github.com/johnny-morrice/timechief-client/launcher/service/launcher"
	syssvc "github.com/johnny-morrice/timechief-client/launcher/service/system"
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

	flagStore := store.StateFlagStore{DB: db}

	isClearState := ctx.Bool("clear-state")
	if isClearState {
		err = flagStore.DeleteAll()
		if err != nil {
			return err
		}
	}

	cfgStore := store.ConfigStore{DB: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	clnt, err := client.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	launchTargetStore := store.LaunchTargetStore{DB: db}
	up := update.Updater{
		VersionStore:      store.VersionStore{DB: db},
		LaunchTargetStore: launchTargetStore,
		CfgStore:          cfgStore,
		Client:            clnt,
		RequestTimeout:    ctx.Duration("service-request-timeout"),
	}

	keyValueStore := store.KeyValueStore{DB: db}

	updateDaemon := daemon.Update{
		Updater:               up,
		StateFlagStore:        flagStore,
		VersionUpdateInterval: ctx.Duration("version-update-interval"),
	}
	deviceDataDaemon := daemon.DeviceData{
		StateFlagStore:  flagStore,
		DeviceDataStore: store.DeviceDataStore{DB: db},
		CfgStore:        cfgStore,
		KeyValueStore:   keyValueStore,
		RequestTimeout:  ctx.Duration("service-request-timeout"),
		RefreshInterval: ctx.Duration("service-refresh-interval"),
	}
	pairingDaemon := daemon.Pairing{
		ConfigStore:          cfgStore,
		StateFlagStore:       flagStore,
		KeyValueStore:        keyValueStore,
		PairingCheckInterval: ctx.Duration("pairing-check-interval"),
		RequestTimeout:       ctx.Duration("service-request-timeout"),
	}

	wifiNetworkStore := store.WifiNetworkStore{DB: db}

	wifiInterfaceStore := store.WifiInterfaceStore{DB: db}
	system := system.System{
		ConfigStore:        cfgStore,
		KeyValueStore:      keyValueStore,
		WifiInterfaceStore: wifiInterfaceStore,
		WifiNetworkStore:   wifiNetworkStore,
		StateFlagStore:     flagStore,
		DB:                 db,
	}

	wifiLoad := daemon.WifiLoadInterfaces{
		StateFlagStore: flagStore,
		System:         system,
	}
	wifiConn := daemon.WifiConnect{
		StateFlagStore: flagStore,
		System:         system,
	}
	wifiScan := daemon.WifiScan{
		StateFlagStore: flagStore,
		System:         system,
	}
	wifiHotspot := daemon.WifiHotspot{
		StateFlagStore: flagStore,
		System:         system,
	}
	networkStatus := daemon.NetworkStatus{
		System: system,
	}

	setup := daemon.Setup{
		KeyValueStore:    keyValueStore,
		WifiNetworkStore: wifiNetworkStore,
		StateFlagStore:   flagStore,
		System:           system,
	}
	internetCheck := daemon.InternetCheck{
		System: system,
	}

	_, err = wifiNetworkStore.GetActive()
	if err == nil {
		err = flagStore.CreateIfNotExists("wifi-connect")
		if err != nil {
			return err
		}
	}

	go wifiLoad.Start(ctx)
	go wifiConn.Start(ctx)
	go wifiScan.Start(ctx)
	go wifiHotspot.Start(ctx)
	go updateDaemon.Start(ctx)
	go deviceDataDaemon.Start(ctx)
	go pairingDaemon.Start(ctx)
	go networkStatus.Start(ctx)
	go setup.Start(ctx)
	go internetCheck.Start(ctx)

	addr := ctx.String("listen-addr")
	mux := http.NewServeMux()
	packages := []apiPackage{
		api.System{
			Service: syssvc.Service{
				System:           system,
				StateFlagStore:   flagStore,
				KeyValueStore:    keyValueStore,
				WifiNetworkStore: wifiNetworkStore,
			},
		},
		api.Data{
			Service: data.Service{
				DeviceDataStore:    store.DeviceDataStore{DB: db},
				LaunchTargetStore:  launchTargetStore,
				StateFlagStore:     flagStore,
				WifiInterfaceStore: wifiInterfaceStore,
				WifiNetworkStore:   wifiNetworkStore,
				KeyValueStore:      keyValueStore,
			},
		},
		api.Launcher{
			Service: launcher.Service{
				LaunchTargetStore: launchTargetStore,
				KeyValueStore:     keyValueStore,
				StateFlagStore:    flagStore,
				CfgStore:          cfgStore,
			},
		},
		fileserver.NewStaticFileHandler(),
	}
	for _, pkg := range packages {
		pkg.AddRoutes(mux)
	}
	return http.ListenAndServe(addr, mux)
}

type apiPackage interface {
	AddRoutes(mux *http.ServeMux)
}
