//go:build !windows

package target

import (
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/task"
	"github.com/urfave/cli/v2"
)

const tarDirectory = "timechief-client-bundle"
const execName = "timechief-client"

func Run(ctx *cli.Context) error {
	targetRoot := ctx.String("target-root")
	logFile := ctx.String("log-file")
	version := ctx.String("version")
	targetBundle := filepath.Join(targetRoot, tarDirectory)
	clientExecutable := filepath.Join(targetBundle, execName)
	cmd := exec.Command(clientExecutable, targetBundle, logFile, version)
	baseURL := ctx.String("daemon-base-url")
	dc, err := daemonclient.NewDaemonClient(baseURL, daemonclient.CredentialProvider{
		APIKey: ctx.String("api-key"),
	})
	if err != nil {
		return err
	}
	rebooter := task.RebootOnExit{
		Command:  cmd,
		Rebooter: clientRebooter{dc: dc},
	}

	err = rebooter.RunTask(ctx)

	if err != nil {
		return fmt.Errorf("failed to run client at %s: %w", clientExecutable, err)
	}
	return nil
}

type clientRebooter struct {
	dc daemonclient.DaemonClient
}

func (rebooter clientRebooter) Reboot() error {
	return rebooter.dc.PostReboot()
}
