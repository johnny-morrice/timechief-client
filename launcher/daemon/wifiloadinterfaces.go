package daemon

import (
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
)

type WifiLoadInterfaces struct {
	StateFlagStore  store.StateFlagStore
	System          system.System
	RefreshInterval time.Duration
}

func (w WifiLoadInterfaces) Start(ctx *cli.Context) {
	daemon := onFlag{
		flagName:        "wifi-load-interfaces",
		stateFlagStore:  w.StateFlagStore,
		refreshInterval: w.RefreshInterval,
	}
	daemon.start(ctx, func(ctx *cli.Context) error {
		return w.System.WifiLoadInterfaces()
	})
}
