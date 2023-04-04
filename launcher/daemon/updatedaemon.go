package daemon

import (
	"log"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
	"github.com/urfave/cli/v2"
)

type UpdateDaemon struct {
	Updater        update.Updater
	StateFlagStore store.StateFlagStore
}

func (daemon UpdateDaemon) Start(ctx *cli.Context) {
	daemon.doTick(ctx)
	runEvery(time.Minute, func() { daemon.doTick(ctx) })
}

func (daemon UpdateDaemon) doTick(ctx *cli.Context) {
	err := daemon.StateFlagStore.CreateIfNotExists(UpdatingFlag)
	if err != nil {
		log.Println(err.Error())
		return
	}
	defer func() {
		err := daemon.StateFlagStore.Delete(UpdatingFlag)
		if err != nil {
			log.Println(err.Error())
		}
	}()

	err = daemon.Updater.Update(ctx)
	if err != nil {
		log.Println(err.Error())
	}
}

func runEvery(duration time.Duration, f func()) {
	for range time.Tick(duration) {
		f()
	}
}

const UpdatingFlag = "updating"
