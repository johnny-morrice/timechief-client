package daemon

import (
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/urfave/cli/v2"
)

type WifiHotspot struct {
	StateFlagStore  store.StateFlagStore
	System          system.System
	RefreshInterval time.Duration
}

func (w WifiHotspot) Start(ctx *cli.Context) {
	daemon := onFlag{
		flagName:        "wifi-hotspot",
		stateFlagStore:  w.StateFlagStore,
		refreshInterval: w.RefreshInterval,
	}
	daemon.start(ctx, func(ctx *cli.Context) error {
		return w.System.WifiHotspot()
	})
}
