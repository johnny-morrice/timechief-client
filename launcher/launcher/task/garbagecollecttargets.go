package task

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type GarbageCollectTargets struct {
	Keep              int
	LaunchTargetStore store.LaunchTargetStore
}

// RunTask deletes old targets and their files.
// It does not return errors but does log them.
// This is because if deleting a target fails, we still want to delete other targets, so we definitely don't want to give up.
func (task GarbageCollectTargets) RunTask(ctx *cli.Context) error {
	if !isSystemAutomationEnabled(ctx) {
		return nil
	}

	if task.Keep == 0 {
		task.Keep = 3
	}
	log.Printf("garbage collecting targets, keeping newest %d", task.Keep)
	garbage, err := task.LaunchTargetStore.ListGarbage(task.Keep)
	if err != nil {
		log.Printf("failed to list garbage targets: %s", err)
		return nil
	}
	for _, storeTarget := range garbage {
		target := service.LaunchTargetFromStore(storeTarget)
		err = target.DeleteFiles()
		if err != nil {
			log.Printf("failed to delete files for target: %v %s", target, err)
			continue
		}
		err = task.LaunchTargetStore.Delete(storeTarget)
		if err != nil {
			log.Printf("failed to delete target: %v %s", storeTarget, err)
			continue
		}
	}
	return nil
}
