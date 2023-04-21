package daemon

import (
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
)

type Wifi struct {
	StateFlagStore  store.StateFlagStore
	System          system.System
	RefreshInterval time.Duration
}

func (w Wifi) Start(ctx *cli.Context) {
	err := w.doTick(ctx)
	if err != nil {
		log.Printf("wifi daemon tick error: %s", err)
	}
	runEvery(w.RefreshInterval, func() {
		err := w.doTick(ctx)
		if err != nil {
			log.Printf("wifi daemon tick error: %s", err)
		}
	})
}

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (w Wifi) doTick(ctx *cli.Context) error {
	isScan, err := w.StateFlagStore.Exists("scan-wifi")
	if err != nil {
		return fmt.Errorf("error checking for scan-wifi state flag: %s", err)
	}
	if !isScan {
		return nil
	}
	err = w.System.SyncWifiNetworks()
	if err != nil {
		return fmt.Errorf("error syncing wifi networks: %s", err)
	}
	err = w.StateFlagStore.Delete("scan-wifi")
	if err != nil {
		return fmt.Errorf("error deleting scan-wifi state flag: %s", err)
	}
	return nil
}
