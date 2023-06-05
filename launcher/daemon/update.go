package daemon

import (
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
	"github.com/urfave/cli/v2"
)

type Update struct {
	Updater               update.Updater
	StateFlagStore        store.StateFlagStore
	VersionUpdateInterval time.Duration
}

func (daemon Update) Start(ctx *cli.Context) {
	err := daemon.doTick(ctx)
	if err != nil {
		log.Println(err.Error())
	}
	runEvery(daemon.VersionUpdateInterval, func() {
		err := daemon.doTick(ctx)
		if err != nil {
			log.Println(err.Error())
		}
	})
}

func (daemon Update) doTick(ctx *cli.Context) error {
	log.Println("checking for updates")
	err := daemon.StateFlagStore.CreateIfNotExists(UpdatingFlag)
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

func runEvery(duration time.Duration, f func()) {
	if duration == 0 {
		panic("runEvery duration must be positive")
	}
	for range time.Tick(duration) {
		f()
	}
}

const UpdatingFlag = "updating"
