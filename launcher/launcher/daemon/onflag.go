package daemon

import (
	"fmt"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type onFlag struct {
	flagName        string
	stateFlagStore  store.StateFlagStore
	refreshInterval time.Duration
}

func (daemon onFlag) start(ctx *cli.Context, action func(ctx *cli.Context) error) {
	err := daemon.doTick(ctx, action)
	if err != nil {
		log.Printf("daemon tick error: %s", err)
	}
	if daemon.refreshInterval == 0 {
		daemon.refreshInterval = time.Second
	}
	util.RunEvery(daemon.refreshInterval, func() {
		err := daemon.doTick(ctx, action)
		if err != nil {
			log.Printf("daemon tick error: %s", err)
		}
	})
}

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (daemon onFlag) doTick(ctx *cli.Context, action func(ctx *cli.Context) error) error {
	isFlagSet, err := daemon.stateFlagStore.Exists(daemon.flagName)
	if err != nil {
		return fmt.Errorf("error checking for %s state flag: %s", daemon.flagName, err)
	}
	if !isFlagSet {
		return nil
	}
	log.Printf("performing daemon action for flag: %s", daemon.flagName)
	err = action(ctx)
	if err != nil {
		return fmt.Errorf("error performing daemon action: %s", err)
	}
	err = daemon.stateFlagStore.Delete(daemon.flagName)
	if err != nil {
		return fmt.Errorf("error deleting %s state flag: %s", daemon.flagName, err)
	}
	return nil
}
