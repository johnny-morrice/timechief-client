package main

import (
	"context"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/publicclient"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/api"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

func main() {

}

// getCLIApp returns a new cli.App instance with two modes, one for launching the timechief client, and the other for running a daemon that downloads updates.
func getCLIApp() *cli.App {
	app := cli.NewApp()
	app.Name = "timechief"
	app.Usage = "Launcher for timechief smartclock"
	app.Version = "0.0.1"
	app.Commands = []*cli.Command{
		{
			Name:    "client",
			Aliases: []string{"c"},
			Usage:   "Launch the timechief client",
			Action:  launchClient,
		},
		{
			Name:    "daemon",
			Aliases: []string{"d"},
			Usage:   "Run the update daemon",
			Action:  launchDaemon,
		},
		{
			Name:   "initialise",
			Usage:  "Initialise the database and download the latest version of the timechief client",
			Action: initialise,
		},
	}
	return app
}

func initialise(c *cli.Context) error {
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	clnt, err := api.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	init := initialiser{
		db: db,
		updater: updater{
			cfgStore:          cfgStore,
			api:               clnt,
			launchTargetStore: store.LaunchTargetStore{Db: db},
			versionStore:      store.VersionStore{Db: db},
		},
	}
	if !init.isInitialised() {
		log.Println("initialising client")
		return init.initialise()
	}
	log.Println("already initialised, skipping initialisation")
	return nil
}

type initialiser struct {
	db *gorm.DB
	updater
}

func (init initialiser) initialise() error {
	err := store.AutoMigrate(init.db)
	if err != nil {
		return err
	}
	return init.firstUpdate()
}

func (init initialiser) isInitialised() bool {
	lt, err := init.launchTargetStore.GetActiveLaunchTarget()
	return err == nil && lt.ID != 0
}

func launchClient(c *cli.Context) error {
	err := initialise(c)
	if err != nil {
		return err
	}
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	store := store.LaunchTargetStore{Db: db}
	launchTarget, err := store.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	// TODO rollback if launch fails.
	return launchTarget.Launch()
}

func launchDaemon(c *cli.Context) error {
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	clnt, err := api.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	up := updater{
		versionStore:      store.VersionStore{Db: db},
		launchTargetStore: store.LaunchTargetStore{Db: db},
		cfgStore:          cfgStore,
		api:               clnt,
	}

	init := initialiser{
		db:      db,
		updater: up,
	}
	daemon := updateDaemon{
		updater: up,
		init:    init,
	}
	daemon.doTick()
	runEvery(time.Minute, daemon.doTick)
	return nil
}

type updateDaemon struct {
	updater
	init initialiser
}

func (daemon updateDaemon) doTick() {
	if !daemon.init.isInitialised() {
		log.Println("daemon not ticking, not initialised")
		return
	}
	err := daemon.checkForUpdates()
	if err != nil {
		log.Println(err.Error())
	}
}

type updater struct {
	versionStore      store.VersionStore
	launchTargetStore store.LaunchTargetStore
	cfgStore          store.ConfigStore
	api               *publicclient.Client
}

func (up updater) firstUpdate() error {
	err := up.syncAPIVersions()
	if err != nil {
		return err
	}
	versions, err := up.versionStore.GetVersions()
	if err != nil {
		return err
	}
	cfg, err := up.cfgStore.GetConfig()
	if err != nil {
		return err
	}
	newVersion := store.FindLatestVersion(cfg, versions)

	if newVersion == nil {
		return nil
	}

	return up.createNewLaunchTarget(cfg, *newVersion)
}

func (up updater) createNewLaunchTarget(cfg store.Config, v store.Version) error {
	newLt := store.LaunchTarget{}
	newLt.Path = cfg.NewInstallPath(v.Version)
	newLt.Version = v
	newLt.VersionID = v.ID
	err := newLt.Install(cfg)
	if err != nil {
		return err
	}

	err = up.launchTargetStore.Create(newLt)
	if err != nil {
		return err
	}

	return nil
}

func (up updater) checkForUpdates() error {
	err := up.syncAPIVersions()
	if err != nil {
		return err
	}
	versions, err := up.versionStore.GetVersions()
	if err != nil {
		return err
	}
	lt, err := up.launchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	cfg, err := up.cfgStore.GetConfig()
	if err != nil {
		return err
	}
	newVersion := store.FindNewVersion(cfg, lt.Version.Version, versions)

	if newVersion == nil {
		return nil
	}

	return up.createNewLaunchTarget(cfg, *newVersion)
}

func (up updater) syncAPIVersions() error {
	var versions []*viewmodel.Version
	ctx := context.Background()
	cursor := ""
	for {
		params := []client.QueryParam{}
		if cursor != "" {
			params = append(params, client.CursorParam(cursor))
		}
		versionPage, err := up.api.Version.List(ctx, params...)
		if err != nil {
			return err
		}
		versions = append(versions, versionPage.Versions...)

		if versionPage.NextCursor == "" {
			break
		}

		cursor = versionPage.NextCursor
	}

	for _, version := range versions {
		storeVersion := store.Version{
			Version: version.Version,
			Product: version.Product,
			Stream:  version.Stream,
			URL:     version.URL,
			SHA256:  []byte(version.SHA256),
			Command: version.Command,
		}

		err := up.versionStore.CreateIfNotExists(storeVersion)
		if err != nil {
			return err
		}
	}
	return nil
}

func runEvery(duration time.Duration, f func()) {
	for range time.Tick(duration) {
		f()
	}
}
