package cmd

import (
	"log"
	"time"

	myclient "github.com/johnny-morrice/timechief-client/launcher/client"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/update"
	"github.com/urfave/cli/v2"
)

func Daemon(ctx *cli.Context) error {
	db, err := store.GetDBConnection(ctx)
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}
	clnt, err := myclient.MakePublicClient(cfg)
	if err != nil {
		return err
	}
	up := update.Updater{
		VersionStore:      store.VersionStore{Db: db},
		LaunchTargetStore: store.LaunchTargetStore{Db: db},
		CfgStore:          cfgStore,
		Client:            clnt,
	}

	daemon := updateDaemon{
		Updater: up,
	}
	daemon.doTick(ctx)
	runEvery(time.Minute, func() { daemon.doTick(ctx) })
	return nil
}

type updateDaemon struct {
	update.Updater
}

func (daemon updateDaemon) doTick(ctx *cli.Context) {
	err := daemon.Update(ctx)
	if err != nil {
		log.Println(err.Error())
	}
}

func runEvery(duration time.Duration, f func()) {
	for range time.Tick(duration) {
		f()
	}
}
