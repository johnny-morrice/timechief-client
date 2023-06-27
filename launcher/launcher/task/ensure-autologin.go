package task

import (
	"errors"
	"log"
	"os"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
	"github.com/urfave/cli/v2"
)

const AutoLoginUnitPath = "/etc/systemd/system/getty@tty1.service.d/autologin.conf"

type EnsureAutologin struct {
	System system.System
}

// RunTask checks for the existence of the autologin systemd unit.
// For reasons unknown, related to expanding the filesystem, this file can disappear from the system!
func (task EnsureAutologin) RunTask(ctx *cli.Context) error {
	log.Println("checking for autologin systemd unit")
	_, err := os.Stat(AutoLoginUnitPath)
	if err == nil && errors.Is(err, os.ErrNotExist) {
		log.Println("autologin systemd unit missing, reinstalling")
		return task.System.EnsureAutoLogin()
	}
	log.Println("restarting to ensure autologin systemd unit is active")
	return task.System.Reboot()
}
