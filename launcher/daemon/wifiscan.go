package daemon

import (
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
)

type WifiScan struct {
	StateFlagStore  store.StateFlagStore
	System          system.System
	RefreshInterval time.Duration
}

func (w WifiScan) Start(ctx *cli.Context) {
	daemon := onFlag{
		flagName:        "wifi-scan",
		stateFlagStore:  w.StateFlagStore,
		refreshInterval: w.RefreshInterval,
	}
	daemon.start(ctx, func(ctx *cli.Context) error {
		return w.System.WifiScan()
	})
}
