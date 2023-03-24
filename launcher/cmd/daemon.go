package cmd

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/publicclient"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/api"
	"github.com/johnny-morrice/timechief-client/launcher/store"
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

	daemon := updateDaemon{
		updater: up,
	}
	daemon.doTick(ctx)
	runEvery(time.Minute, func() { daemon.doTick(ctx) })
	return nil
}

type updateDaemon struct {
	updater
}

func (daemon updateDaemon) doTick(ctx *cli.Context) {
	err := daemon.update(ctx)
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

func (up updater) firstUpdate(ctx *cli.Context) error {
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
	newVersion, err := store.FindLatestVersion(cfg, versions)

	if errors.Is(err, store.ErrNoVersion) {
		return fmt.Errorf("cannot initialise, no version available: %w", err)
	}

	if err != nil {
		return err
	}

	return up.createNewLaunchTarget(ctx, cfg, newVersion)
}

func (up updater) createNewLaunchTarget(ctx *cli.Context, cfg store.Config, v store.Version) error {
	log.Printf("creating launch target for version: %s", v.Version)
	newLt := store.LaunchTarget{}
	newLt.Path = cfg.NewInstallPath(v.Version)
	newLt.Version = v
	newLt.VersionID = v.ID
	doInstallDaemon := ctx.Bool("install-daemon")
	err := newLt.Install(cfg, doInstallDaemon)
	if err != nil {
		return err
	}

	err = up.launchTargetStore.Create(&newLt)
	if err != nil {
		return err
	}

	err = up.launchTargetStore.SetActive(newLt)
	if err != nil {
		return err
	}

	log.Printf("created launch target for version: %s", v.Version)

	return nil
}

func (up updater) update(ctx *cli.Context) error {
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
	newVersion, err := store.FindNewVersion(cfg, lt.Version.Version, versions)

	if errors.Is(err, store.ErrNoVersion) {
		return nil
	}

	if err != nil {
		return err
	}

	return up.createNewLaunchTarget(ctx, cfg, newVersion)
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
		// Decode base64 encoded SHA256
		log.Printf("processing version %s UUID: %s Command: %v", version.Version, version.UUID, version.Command)
		log.Printf("decoding sha %s", version.SHA256)
		shaBytes, err := base64.StdEncoding.DecodeString(version.SHA256)
		if err != nil {
			return err
		}
		log.Printf("decoded sha %x", shaBytes)
		storeVersion := store.Version{
			UUID:    version.UUID,
			Version: version.Version,
			Product: version.Product,
			Stream:  version.Stream,
			URL:     version.URL,
			SHA256:  shaBytes,
			Command: version.Command,
		}

		err = up.versionStore.CreateIfNotExists(&storeVersion)
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
