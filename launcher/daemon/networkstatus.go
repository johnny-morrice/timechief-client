package daemon

import (
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
)

type NetworkStatus struct {
	System          system.System
	RefreshInterval time.Duration
}

func (daemon NetworkStatus) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Printf("daemon tick error: %s", err)
	}
	if daemon.RefreshInterval == 0 {
		daemon.RefreshInterval = 5 * time.Second
	}
	runEvery(daemon.RefreshInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Printf("network status daemon tick error: %s", err)
		}
	})
}

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (daemon NetworkStatus) doTick(ctx *cli.Context) error {
	return daemon.System.LoadNetworkStatus()
}
