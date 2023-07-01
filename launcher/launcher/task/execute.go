package task

import (
	"fmt"
	"log"
	"os/exec"

	"github.com/urfave/cli/v2"
)

type RebootOnExit struct {
	Command  *exec.Cmd
	Rebooter Rebooter
}

func (monitor RebootOnExit) RunTask(ctx *cli.Context) error {
	out, err := monitor.Command.CombinedOutput()
	log.Println("command output: ", string(out))
	if err != nil {
		return fmt.Errorf("command monitor failed: %w", err)
	}
	log.Println("client app terminated")
	// When the client app terminates, run the recover action.
	return monitor.Rebooter.Reboot()
}

type Rebooter interface {
	Reboot() error
}
