package update

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type Initialiser struct {
	DB            *gorm.DB
	KeyValueStore store.KeyValueStore
	Updater
}

func (init Initialiser) Initialise(ctx *cli.Context, cfg store.Config) error {
	err := store.AutoMigrate(init.DB)
	if err != nil {
		return err
	}
	err = init.cfgStore.SetConfig(cfg)
	if err != nil {
		return err
	}
	err = init.KeyValueStore.Set("setup", "Begin")
	if err != nil {
		return err
	}
	err = init.FirstUpdate(ctx)
	if err != nil {
		return err
	}
	log.Print("initialised client OK")
	return nil
}

func (init Initialiser) IsInitialised() bool {
	lt, err := init.launchTargetStore.GetActiveLaunchTarget()
	return err == nil && lt.ID != 0
}
