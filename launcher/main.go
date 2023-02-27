package main

import (
	"log"
	"time"

	"github.com/urfave/cli/v2"
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
	// TODO: check if database exists or needs creating.
	// TODO: check if at least one version is available.
	// TODO: if no version is available, download the latest version.
	return nil
}

func launchClient(c *cli.Context) error {
	// TODO: if not initialised, wait until initialised.
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
	daemon := updateDaemon{
		versionStore: VersionStore{db: db},
		cfgStore:     cfgStore,
		api:          api,
	}
	daemon.doTick()
	runEvery(time.Minute, daemon.doTick)
	return nil
}

type updateDaemon struct {
	versionStore      VersionStore
	launchTargetStore LaunchTargetStore
	cfgStore          ConfigStore
	api               ArtifactAPIClient
}

func (daemon updateDaemon) doTick() {
	// TODO: if not initialised, skip until until initialised.
	err := daemon.checkForUpdates()
	if err != nil {
		log.Println(err.Error())
	}
}

func (daemon updateDaemon) checkForUpdates() error {
	err := daemon.syncAPIVersions()
	if err != nil {
		return err
	}
	versions, err := daemon.versionStore.GetVersions()
	if err != nil {
		return err
	}
	lt, err := daemon.launchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	cfg, err := daemon.cfgStore.GetConfig()
	if err != nil {
		return err
	}
	newVersion := FindNewVersion(cfg, lt.Version.Version, versions)

	if newVersion == nil {
		return nil
	}

	newLt := LaunchTarget{}
	newLt.Path = cfg.NewInstallPath(newVersion.Version)
	newLt.Version = *newVersion
	newLt.VersionID = newVersion.ID
	err = newLt.Install()
	if err != nil {
		return err
	}

	err = daemon.launchTargetStore.Create(newLt)
	if err != nil {
		return err
	}

	return nil
}

func (daemon updateDaemon) syncAPIVersions() error {
	versions, err := daemon.api.FetchVersions()
	if err != nil {
		return err
	}
	for _, version := range versions {
		err = daemon.versionStore.CreateIfNotExists(version)
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
