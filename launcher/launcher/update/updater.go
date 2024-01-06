package update

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/task"
	"github.com/urfave/cli/v2"
)

type Updater struct {
	versionStore      store.VersionStore
	launchTargetStore store.LaunchTargetStore
	versionDownloader service.VersionDownloader
	cfgStore          store.ConfigStore
	clientFactory     ClientFactory
	client            v2.ClientInterface
	requestTimeout    time.Duration
	once              *sync.Once
}

func MakeUpdater(cfgStore store.ConfigStore, versionStore store.VersionStore, launchTargetStore store.LaunchTargetStore, versionDownloader service.VersionDownloader, clientFactory ClientFactory, requestTimeout time.Duration) Updater {
	return Updater{
		versionStore:      versionStore,
		launchTargetStore: launchTargetStore,
		cfgStore:          cfgStore,
		clientFactory:     clientFactory,
		versionDownloader: versionDownloader,
		requestTimeout:    requestTimeout,
		once:              &sync.Once{},
	}
}

type ClientFactory func() (v2.ClientInterface, error)

func (up Updater) getClient() (v2.ClientInterface, error) {
	var err error
	up.once.Do(func() {
		up.client, err = up.clientFactory()
	})
	return up.client, err
}

func (up Updater) FirstUpdate(ctx *cli.Context) error {
	err := up.SyncAPIVersions(ctx)
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
	err := lt.Install(cfg, up.versionDownloader, doInstallDaemon)
	if err != nil {
		return err
	}

	err = up.launchTargetStore.Create(&newStoreLt)
	if err != nil {
		return err
	}

	err = up.launchTargetStore.SetActive(newStoreLt)
	if err != nil {
		return err
	}

	log.Printf("created launch target for version: %s", v.Details())

	return nil
}

func (up Updater) Update(ctx *cli.Context) error {
	garbageCollector := task.GarbageCollectTargets{
		LaunchTargetStore: up.launchTargetStore,
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
	versions, err := up.versionStore.GetVersions()
	if err != nil {
		return err
	}
	lt, err := up.launchTargetStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	log.Printf("update seeking newer version than %s", lt.Version.Details())
	cfg, err := up.cfgStore.GetConfig()
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

func (up Updater) fetchVersions(ctx *cli.Context) ([]v2.Version, error) {
	requestContext, cancel := context.WithTimeout(context.Background(), up.requestTimeout)
	defer cancel()
	product := ""
	stream := ""
	client, err := up.getClient()
	if err != nil {
		return nil, err
	}
	versionResp, err := client.ListLatestVersions(requestContext, product, stream)
	if err != nil {
		return nil, err
	}
	defer versionResp.Body.Close()
	if versionResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", versionResp.StatusCode)
	}
	var result []v2.Version
	err = json.NewDecoder(versionResp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (up Updater) SyncAPIVersions(ctx *cli.Context) error {
	versions, err := up.fetchVersions(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch versions: %w", err)
	}

	for _, version := range versions {
		// Decode base64 encoded SHA256
		// TODO nil checks
		shaBytes, err := base64.StdEncoding.DecodeString(*version.Sha256)
		if err != nil {
			return err
		}

		storeVersion := store.Version{
			UUID:    *version.Uuid,
			Version: *version.Version,
			Product: *version.Product,
			Stream:  *version.Stream,
			SHA256:  shaBytes,
			Command: *version.Command,
		}

		err = up.versionStore.CreateIfNotExists(&storeVersion)
		if err != nil {
			return err
		}
	}
	return nil
}
