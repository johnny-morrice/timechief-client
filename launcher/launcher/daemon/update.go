package daemon

import (
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon/util"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type Update struct {
	Updater               Updater
	StateFlagStore        store.StateFlagStore
	KeyValueStore         store.KeyValueStore
	VersionUpdateInterval time.Duration
}

type Updater interface {
	Update(ctx *cli.Context) error
}

func (daemon Update) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Println(err.Error())
	}
	util.RunEvery(daemon.VersionUpdateInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Println(err.Error())
		}
	})
}

func (daemon Update) doTick(ctx *cli.Context) error {
	log.Println("checking for updates")

	setupState, err := daemon.KeyValueStore.Get("setup")
	if err != nil {
		return err
	}

	if setupState != SetupFlagInternetConnected {
		log.Println("not connected to internet, skipping update")
		return nil
	}

	err = daemon.StateFlagStore.CreateIfNotExists(UpdatingFlag)
	if err != nil {
		return err
	}
	defer func() {
		log.Println("update done")
		err := daemon.StateFlagStore.Delete(UpdatingFlag)
		if err != nil {
			log.Println(err.Error())
		}
	}()

	err = daemon.Updater.Update(ctx)
	if err != nil {
		return err
	}
	return nil
}

const UpdatingFlag = "updating"
