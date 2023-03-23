package cmd

import (
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

func RunClient(c *cli.Context) error {
	standalone := c.Bool("standalone")
	if !standalone {
		panic("not implemented")
	}
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	ltStore := store.LaunchTargetStore{Db: db}
	launchTarget, err := ltStore.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	cfgStore := store.ConfigStore{Db: db}
	cfg, err := cfgStore.GetConfig()
	if err != nil {
		return err
	}

	// TODO rollback if launch fails.
	return launchTarget.Run(cfg)
}
