package main

import (
	"log"
	"time"

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
	db, err := getDBConnection()
	if err != nil {
		return err
	}
	cfgStore := ConfigStore{db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	init := initialiser{
		db: db,
		updater: updater{
			cfgStore:          cfgStore,
			api:               ArtifactAPIClient{cfg.GetArtifactURL()},
			launchTargetStore: LaunchTargetStore{db: db},
			versionStore:      VersionStore{db: db},
		},
	}
	if !init.isInitialised() {
		return init.initialise()
	}
	return nil
}

type initialiser struct {
	db *gorm.DB
	updater
}

func (init initialiser) initialise() error {
	err := autoMigrate(init.db)
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
	db, err := getDBConnection()
	if err != nil {
		return err
	}
	store := LaunchTargetStore{db: db}
	launchTarget, err := store.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	// TODO rollback if launch fails.
	return launchTarget.Launch()
}

func launchDaemon(c *cli.Context) error {
	db, err := getDBConnection()
	if err != nil {
		return err
	}
	cfgStore := ConfigStore{db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	api := ArtifactAPIClient{cfg.GetArtifactURL()}
	up := updater{
		versionStore:      VersionStore{db: db},
		launchTargetStore: LaunchTargetStore{db: db},
		cfgStore:          cfgStore,
		api:               api,
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
	versionStore      VersionStore
	launchTargetStore LaunchTargetStore
	cfgStore          ConfigStore
	api               ArtifactAPIClient
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
	newVersion := FindLatestVersion(cfg, versions)

	if newVersion == nil {
		return nil
	}

	return up.createNewLaunchTarget(cfg, *newVersion)
}

func (up updater) createNewLaunchTarget(cfg Config, v Version) error {
	newLt := LaunchTarget{}
	newLt.Path = cfg.NewInstallPath(v.Version)
	newLt.Version = v
	newLt.VersionID = v.ID
	err := newLt.Install()
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
	newVersion := FindNewVersion(cfg, lt.Version.Version, versions)

	if newVersion == nil {
		return nil
	}

	return up.createNewLaunchTarget(cfg, *newVersion)
}

func (up updater) syncAPIVersions() error {
	versions, err := up.api.FetchVersions()
	if err != nil {
		return err
	}
	for _, version := range versions {
		err = up.versionStore.CreateIfNotExists(version)
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
