package update

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
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/task"
	"github.com/urfave/cli/v2"
)

type Updater struct {
	VersionStore      store.VersionStore
	LaunchTargetStore store.LaunchTargetStore
	CfgStore          store.ConfigStore
	Client            *publicclient.Client
	RequestTimeout    time.Duration
}

func (up Updater) FirstUpdate(ctx *cli.Context) error {
	err := up.SyncAPIVersions(ctx)
	if err != nil {
		return err
	}
	versions, err := up.VersionStore.GetVersions()
	if err != nil {
		return err
	}
	cfg, err := up.CfgStore.GetConfig()
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

	return up.CreateNewLaunchTarget(ctx, cfg, newVersion)
}

func (up Updater) CreateNewLaunchTarget(ctx *cli.Context, cfg store.Config, v store.Version) error {
	log.Printf("creating launch target for version: %s", v.Details())
	newStoreLt := store.LaunchTarget{}
	newStoreLt.Path = cfg.NewInstallPath(v.Version)
	newStoreLt.Version = v
	newStoreLt.VersionID = v.ID
	doInstallDaemon := ctx.Bool("install-daemon")
	lt := service.LaunchTargetFromStore(newStoreLt)
	err := lt.Install(cfg, doInstallDaemon)
	if err != nil {
		return err
	}

	err = up.LaunchTargetStore.Create(&newStoreLt)
	if err != nil {
		return err
	}

	err = up.LaunchTargetStore.SetActive(newStoreLt)
	if err != nil {
		return err
	}

	log.Printf("created launch target for version: %s", v.Details())

	return nil
}

func (up Updater) Update(ctx *cli.Context) error {
	garbageCollector := task.GarbageCollectTargets{
		LaunchTargetStore: up.LaunchTargetStore,
	}
	defer func() {
		myErr := garbageCollector.RunTask(ctx)
		if myErr != nil {
			log.Printf("failed to garbage collect: %s", myErr)
		}
	}()
	err := up.SyncAPIVersions(ctx)
	if err != nil {
		return err
	}
	versions, err := up.VersionStore.GetVersions()
	if err != nil {
		return err
	}
	lt, err := up.LaunchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	log.Printf("update seeking newer version than %s", lt.Version.Details())
	cfg, err := up.CfgStore.GetConfig()
	if err != nil {
		return err
	}
	newVersion, err := store.FindNewVersion(cfg, lt.Version.Version, versions)

	if errors.Is(err, store.ErrNoVersion) {
		log.Printf("no new version found")
		return nil
	}

	if err != nil {
		return err
	}

	return up.CreateNewLaunchTarget(ctx, cfg, newVersion)
}

func (up Updater) SyncAPIVersions(ctx *cli.Context) error {
	var versions []*viewmodel.Version
	cursor := ""
	for {
		params := []client.QueryParam{}
		if cursor != "" {
			params = append(params, client.CursorParam(cursor))
		}
		requestContext, cancel := context.WithTimeout(context.Background(), up.RequestTimeout)
		defer cancel()
		versionPage, err := up.Client.Version.List(requestContext, params...)
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
		// log.Printf("processing version %s UUID: %s Command: %v", version.Version, version.UUID, version.Command)
		// log.Printf("decoding sha %s", version.SHA256)
		shaBytes, err := base64.StdEncoding.DecodeString(version.SHA256)
		if err != nil {
			return err
		}
		// log.Printf("decoded sha %x", shaBytes)
		storeVersion := store.Version{
			UUID:    version.UUID,
			Version: version.Version,
			Product: version.Product,
			Stream:  version.Stream,
			URL:     version.URL,
			SHA256:  shaBytes,
			Command: version.Command,
		}

		err = up.VersionStore.CreateIfNotExists(&storeVersion)
		if err != nil {
			return err
		}
	}
	return nil
}
