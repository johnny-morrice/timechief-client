package cmd

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"github.com/urfave/cli/v2"
)

func RunClient(ctx *cli.Context) error {
	baseURL := ctx.String("daemon-base-url")
	credentialsPath := ctx.String("credentials-path")
	dc, err := daemonclient.NewDaemonClient(baseURL, credentialsPath)
	if err != nil {
		return fmt.Errorf("error building daemon client: %w", err)
	}
	err = recoverClient(dc)
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
	targetEnv, err := dc.GetTargetEnv()
	if err != nil {
		return fmt.Errorf("error getting target env: %w", err)
	}
	err = exportTargetEnv(targetEnv.Env)
	if err != nil {
		return fmt.Errorf("error exporting target env: %w", err)
	}

	return target.Run(cfg)
}

func exportTargetEnv(targetEnv map[string]string) error {
	for k, v := range targetEnv {
		err := os.Setenv(k, v)
		if err != nil {
			return fmt.Errorf("error setting env: %w", err)
		}
	}
	return nil
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
