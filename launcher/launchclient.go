package main

import (
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

func launchClient(c *cli.Context) error {
	db, err := store.GetDBConnection()
	if err != nil {
		return err
	}
	defer store.CloseDB(db)
	store := store.LaunchTargetStore{Db: db}
	launchTarget, err := store.GetActiveLaunchTarget()
	if err != nil {
		return err
	}
	// TODO rollback if launch fails.
	return launchTarget.Run()
}
