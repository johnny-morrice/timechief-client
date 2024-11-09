package daemon

import (
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/urfave/cli/v2"
)

type InternetCheck struct {
	System          system.System
	RefreshInterval time.Duration
}

func (daemon InternetCheck) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Printf("daemon tick error: %s", err)
	}
	if daemon.RefreshInterval == 0 {
		daemon.RefreshInterval = 5 * time.Second
	}
	util.RunEvery(daemon.RefreshInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Printf("daemon tick error: %s", err)
		}
	})
}

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (daemon InternetCheck) doTick(ctx *cli.Context) error {
	err := daemon.System.CheckInternet()
	if err != nil {
		return fmt.Errorf("failed to check internet status: %w", err)
	}

	return nil
}
