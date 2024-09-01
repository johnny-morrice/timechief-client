package cmd

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/api"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/api/auth"
	mediaapi "github.com/johnny-morrice/timechief-client/launcher/launcher/api/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/api/middleware"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/api/websetup"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/authzero"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/clientbuilder"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/crypt"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon"
	datadaemon "github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/data"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/licenseactivation"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/picturedownload"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/refreshtoken"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/videodownload"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/fileserver"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
	datasvc "github.com/johnny-morrice/timechief-client/launcher/launcher/service/data"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/launcher"
	mediasvc "github.com/johnny-morrice/timechief-client/launcher/launcher/service/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
	syssvc "github.com/johnny-morrice/timechief-client/launcher/launcher/service/system"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/versiondownload"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
	websetupservice "github.com/johnny-morrice/timechief-client/launcher/launcher/service/websetup"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/sound"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/task"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/update"
	"github.com/urfave/cli/v2"
)

func Daemon(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}
	defer store.CloseDB(db)

	err = fileserver.InitialiseFS()
	if err != nil {
		return err
	}

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

	launchTargetStore := store.LaunchTargetStore{DB: db}

	keyValueStore := store.KeyValueStore{DB: db}

	soundClient := daemonclient.NewDaemonClient(ctx.String("sound-daemon-base-url"))
	soundService, err := sound.NewSoundService(soundClient, keyValueStore)
	if err != nil {
		return err
	}

	timechiefClient, err := clientbuilder.Builder{}.CfgStore(cfgStore).KVStore(keyValueStore).Build()
	if err != nil {
		return err
	}
	noAuthClientFactory := func() (v2.ClientInterface, error) {
		return clientbuilder.Builder{}.CfgStore(cfgStore).KVStore(keyValueStore).UseAuth(false).Build()
	}

	versionDownloader := versiondownload.MakeVersionDownloader(cfgStore, noAuthClientFactory)
	up := update.MakeUpdater(cfgStore, store.VersionStore{DB: db}, launchTargetStore, versionDownloader, noAuthClientFactory, ctx.Duration("service-request-timeout"))

	myDevices := daemon.MakeMyDevices(timechiefClient, keyValueStore, flagStore, ctx.Duration("service-request-timeout"), ctx.Duration("service-refresh-interval"))

	updateDaemon := daemon.Update{
		Updater:               up,
		StateFlagStore:        flagStore,
		KeyValueStore:         keyValueStore,
		VersionUpdateInterval: ctx.Duration("version-update-interval"),
	}
	deviceDataStore := store.DeviceDataStore{DB: db}
	deviceDataDaemon := datadaemon.MakeDataDaemon(timechiefClient, deviceDataStore, soundService, keyValueStore, flagStore, ctx.Duration("service-request-timeout"), ctx.Duration("service-refresh-interval"))
	// pairingDaemon := daemon.Pairing{
	// 	ConfigStore:          cfgStore,
	// 	StateFlagStore:       flagStore,
	// 	KeyValueStore:        keyValueStore,
	// 	PairingCheckInterval: ctx.Duration("pairing-check-interval"),
	// 	RequestTimeout:       ctx.Duration("service-request-timeout"),
	// }
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	authZeroBaseURL, err := cfg.GetAuthZeroBaseURL()
	if err != nil {
		return err
	}
	authZeroClient, err := authzero.MakeAuthZeroClient(authZeroBaseURL)
	if err != nil {
		return err
	}
	pairingDaemon := daemon.MakePairingDaemon(cfgStore, keyValueStore, flagStore, authZeroClient, ctx.Duration("pairing-check-interval"), ctx.Duration("service-request-timeout"))

	// TODO don't use the pairing parameter.  Or do?!
	refreshTokenDaemon, err := refreshtoken.MakeRefreshTokenDaemon(cfgStore, authZeroClient, keyValueStore, ctx.Duration("pairing-check-interval"), ctx.Duration("service-request-timeout"))
	if err != nil {
		return err
	}

	wifiNetworkStore := store.WifiNetworkStore{DB: db}

	wifiInterfaceStore := store.WifiInterfaceStore{DB: db}
	system := system.System{
		ConfigStore:            cfgStore,
		KeyValueStore:          keyValueStore,
		WifiInterfaceStore:     wifiInterfaceStore,
		WifiNetworkStore:       wifiNetworkStore,
		StateFlagStore:         flagStore,
		DB:                     db,
		EnableSystemAutomation: ctx.Bool("system-automation"),
		ShutdownCallback:       sound.NewShutdownCallback(soundService),
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
	// TODO make this configurable
	const videoDownloadInterval = 53 * time.Minute
	videoSource, err := video.MakeDeviceVideoSource(deviceDataStore)
	if err != nil {
		return err
	}
	mediaFilesystem, err := media.MakeMediaFS(cfg)
	if err != nil {
		return fmt.Errorf("failed to make video filesystem: %v", err)
	}
	// TODO make downloader duration configurable.
	downloader, err := media.MakeMediaDownloader(time.Minute * 10)
	if err != nil {
		return err
	}
	const pictureInterval = time.Minute
	pictureSource, err := picture.MakeDevicePictureSource(deviceDataStore)
	if err != nil {
		return err
	}
	pictureService, err := picture.MakeService(keyValueStore, mediaFilesystem, downloader, deviceDataStore)
	if err != nil {
		return err
	}
	pictureDownloader, err := picturedownload.MakeDaemon(pictureInterval, pictureSource, pictureService)
	if err != nil {
		return err
	}
	videoService, err := video.MakeService(keyValueStore, mediaFilesystem, downloader, deviceDataStore)
	if err != nil {
		return err
	}
	videoDownload, err := videodownload.MakeDaemon(videoDownloadInterval, videoSource, videoService)
	if err != nil {
		return err
	}

	timeSync := daemon.TimeSync{
		Syncer: system,
	}

	licenseDaemon, err := licenseactivation.MakeLicenseActivationDaemon(timechiefClient, keyValueStore, ctx.Duration("service-request-timeout"), ctx.Duration("service-refresh-interval"))
	if err != nil {
		return err
	}

	expandRootFS := task.ExpandRootFS{
		KeyValueStore: keyValueStore,
		System:        system,
	}

	err = expandRootFS.RunTask(ctx)
	if err != nil {
		return err
	}

	ensureAutoLogin := task.EnsureAutologin{
		System: system,
	}

	err = ensureAutoLogin.RunTask(ctx)
	if err != nil {
		return err
	}

	videoApi, err := mediaapi.NewMediaAPI(videoService, pictureService)
	if err != nil {
		return err
	}

	go timeSync.Start(ctx)
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
	go myDevices.Start(ctx)
	go licenseDaemon.Start(ctx)
	go refreshTokenDaemon.Start(ctx)
	go videoDownload.Start(ctx)
	go pictureDownloader.Start(ctx)

	addr := ctx.String("listen-addr")
	rootMux := http.NewServeMux()
	apiMux := http.NewServeMux()
	mediaMux := http.NewServeMux()

	mediaService, err := makeMediaService(ctx, videoService, pictureService, deviceDataStore)
	if err != nil {
		return err
	}

	dataService := datasvc.MakeService(
		mediaService,
		deviceDataStore,
		launchTargetStore,
		flagStore,
		keyValueStore,
		wifiInterfaceStore,
		wifiNetworkStore,
	)

	securePackages := []apiPackage{
		api.System{
			Service: syssvc.Service{
				System:           system,
				StateFlagStore:   flagStore,
				KeyValueStore:    keyValueStore,
				WifiNetworkStore: wifiNetworkStore,
			},
		},
		api.MakeDataAPI(dataService),
		api.Launcher{
			Service: launcher.Service{
				LaunchTargetStore: launchTargetStore,
				KeyValueStore:     keyValueStore,
				StateFlagStore:    flagStore,
				CfgStore:          cfgStore,
				SoundService:      soundService,
			},
		},
	}
	for _, pkg := range securePackages {
		pkg.AddRoutes(apiMux)
	}
	mediaPackages := []apiPackage{
		videoApi,
	}
	for _, pkg := range mediaPackages {
		pkg.AddRoutes(mediaMux)
	}
	err = regenerateAppAPIKey(ctx, keyValueStore)
	if err != nil {
		return err
	}
	apiModeHandler, err := middleware.MakeAuthModeMiddleware(keyValueStore, apiMux, middleware.APIAuthMode)
	if err != nil {
		return err
	}
	apiHandler, err := middleware.NewAuthMiddleware(keyValueStore, apiModeHandler)
	if err != nil {
		return err
	}

	webMux := http.NewServeMux()
	fileServer := fileserver.NewStaticFileHandler()
	fileServer.AddRoutes(webMux)

	webSetupMux := http.NewServeMux()
	webSetupService, err := websetupservice.MakeService(wifiNetworkStore)
	if err != nil {
		return err
	}
	webSetupAPI, err := websetup.MakeWebSetupAPI(webSetupService)
	if err != nil {
		return err
	}
	webSetupAPI.AddRoutes(webSetupMux)
	webSetupMode, err := middleware.MakeAuthModeMiddleware(keyValueStore, webSetupMux, middleware.WebSetupAuthMode)
	if err != nil {
		return err
	}
	webSetupHandler, err := middleware.NewAuthMiddleware(keyValueStore, webSetupMode)
	if err != nil {
		return err
	}

	authMux := http.NewServeMux()
	authAPI, err := auth.MakeAuthAPI()
	if err != nil {
		return err
	}
	authAPI.AddRoutes(authMux)
	authHandler, err := middleware.NewAuthMiddleware(keyValueStore, authMux)
	if err != nil {
		return err
	}

	rootMux.Handle("/api/", apiHandler)
	rootMux.Handle("/media/", mediaMux)
	rootMux.Handle("/web-setup/", webSetupHandler)
	rootMux.Handle("/auth/", authHandler)
	rootMux.Handle("/", webMux)

	onInitialiseComplete(soundService)
	return http.ListenAndServe(addr, rootMux)
}

func makeMediaService(ctx *cli.Context, videoService mediasvc.VideoService, pictureService mediasvc.PictureService, deviceDataStore store.DeviceDataStore) (datasvc.MediaService, error) {
	mediaFilePath := ctx.String("media-file")
	if mediaFilePath == "" {
		return mediasvc.MakeService(videoService, pictureService, deviceDataStore)
	}
	return mediasvc.MakeFileService(mediaFilePath, ctx.Duration("media-file-frequency"))
}

func regenerateAppAPIKey(ctx *cli.Context, kvStore store.KeyValueStore) error {
	ctxApiKey := ctx.String("test-app-api-key")
	if ctxApiKey != "" {
		err := kvStore.Set(store.APIAppAuthKey, ctxApiKey)
		if err != nil {
			return fmt.Errorf("failed to set app API key from command line parameter: %v", err)
		}
		log.Println("INSECURE: using app API key from command line")
		return nil
	}

	apiKey, err := crypt.GenerateRandomAPIKey()
	if err != nil {
		return fmt.Errorf("failed to generate app API key: %v", err)
	}
	err = kvStore.Set(store.APIAppAuthKey, apiKey)
	if err != nil {
		return fmt.Errorf("failed to set app API key: %v", err)
	}
	return nil
}

func onInitialiseComplete(soundService sound.Service) {
	go func() {
		// Let's fudge it and wait a bit for the system to settle
		time.Sleep(5 * time.Second)
		err := soundService.PlayStartup()
		if err != nil {
			log.Printf("Failed to play startup sound: %v", err)
		}
	}()
}

type apiPackage interface {
	AddRoutes(mux *http.ServeMux)
}
