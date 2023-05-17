package daemon

import (
	"errors"
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type WifiConnect struct {
	KeyValueStore   store.KeyValueStore
	System          system.System
	RefreshInterval time.Duration
}

func (daemon WifiConnect) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Printf("wifi-connect daemon tick error: %s", err)
	}
	if daemon.RefreshInterval == 0 {
		daemon.RefreshInterval = 5 * time.Second
	}
	runEvery(daemon.RefreshInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Printf("wifi-connect daemon tick error: %s", err)
		}
	})
}

// doTick is a single step in the main loop of the daemon.
// Every tick we check for a "scan-wifi" state flag.
// If the state flag is set, we synchronise the wifi cards and wifi networks using the system package.
// We then clear the state flag.
func (daemon WifiConnect) doTick(ctx *cli.Context) error {
	uuid, err := daemon.KeyValueStore.Get("wifi-connect")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	err = daemon.System.WifiConnect(uuid)
	if err != nil {
		return err
	}
	return daemon.KeyValueStore.Delete("wifi-connect")
}
