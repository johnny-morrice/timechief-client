package target

import (
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/urfave/cli/v2"
)

const tarDirectory = "timechief-client-bundle"
const execName = "timechief-client"

func Run(ctx *cli.Context) error {
	targetRoot := ctx.String("target-root")
	clientExecutable := filepath.Join(targetRoot, tarDirectory, execName)
	err := exec.Command(clientExecutable).Run()
	if err != nil {
		return fmt.Errorf("failed to run client at %s: %w", clientExecutable, err)
	}
	return nil
}
