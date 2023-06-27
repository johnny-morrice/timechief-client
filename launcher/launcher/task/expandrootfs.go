package task

import (
	"errors"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type ExpandRootFS struct {
	KeyValueStore store.KeyValueStore
	System        system.System
}

func (task ExpandRootFS) RunTask(ctx *cli.Context) error {
	log.Println("checking for rootfs expansion")
	proceed, err := task.isProceed()
	if err != nil {
		return err
	}
	if !proceed {
		return nil
	}
	log.Println("expanding rootfs")
	err = task.doExpandRootFs()
	if err != nil {
		return err
	}

	err = task.KeyValueStore.Set("expandrootfs", "done")
	if err != nil {
		return err
	}

	log.Println("expand rootfs success, rebooting")

	return task.System.Reboot()
}

func (task ExpandRootFS) isProceed() (bool, error) {
	state, err := task.KeyValueStore.Get("expandrootfs")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			task.KeyValueStore.Set("expandrootfs", "pending")
			return true, nil
		} else {
			return false, err
		}
	}
	if state == "pending" {
		return true, nil
	}
	return false, nil
}

func (task ExpandRootFS) doExpandRootFs() error {
	return task.System.ExpandRootFS()
}
