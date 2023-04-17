package cmd

import (
	"errors"
	"fmt"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/client/daemonclient"
	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

func RunClient(ctx *cli.Context) error {
	standalone := ctx.Bool("standalone")
	if standalone {
		return runStandaloneClient(ctx)
	}
	return runClientWithDaemon(ctx)
}

func runClientWithDaemon(ctx *cli.Context) error {
	baseURL := ctx.String("daemon-base-url")
	dc := daemonclient.NewDaemonClient(baseURL)
	err := recoverClient(dc)
	if err != nil {
		return fmt.Errorf("error recovering client: %w", err)
	}
	cfg, err := dc.GetConfig()
	if err != nil {
		return fmt.Errorf("error getting config: %w", err)
	}

	target, err := dc.GetTarget()
	if err != nil {
		return fmt.Errorf("error getting target: %w", err)
	}

	return target.Run(cfg)
}

func recoverClient(dc daemonclient.DaemonClient) error {
	recoverInterval := 500 * time.Millisecond
	recoverLimit := 10 * time.Second
	return pollUntil(recoverInterval, recoverLimit, func() (bool, error) {
		targetStatus, err := dc.PostTargetRecover()
		if err != nil {
			return false, err
		}
		return targetStatus.Ready, nil
	})
}

func pollUntil(duration time.Duration, limit time.Duration, f func() (bool, error)) error {
	start := time.Now()
	endTime := start.Add(limit)
	for {
		res, err := f()
		if err != nil {
			return err
		}
		if res {
			return nil
		}
		if time.Now().After(endTime) {
			return errors.New("polling timed out")
		}
		time.Sleep(duration)
	}
}

func runStandaloneClient(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	ltStore := store.LaunchTargetStore{Db: db}
	storeTarget, err := ltStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}

	clientConfig, err := service.ReadClientConfig(cfg)
	if err != nil {
		return err
	}

	err = clientConfig.ExportEnv()
	if err != nil {
		return err
	}

	launchTarget := service.LaunchTargetFromStore(storeTarget)

	// TODO rollback if launch fails.
	return launchTarget.Run(cfg)
}
