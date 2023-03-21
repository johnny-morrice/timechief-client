package target

import (
	"fmt"
	"log"
	"os/exec"
	"path/filepath"

	"github.com/urfave/cli/v2"
)

const tarDirectory = "timechief-client-bundle"
const execName = "timechief-client"

func Run(ctx *cli.Context) error {
	targetRoot := ctx.String("target-root")
	targetBundle := filepath.Join(targetRoot, tarDirectory)
	clientExecutable := filepath.Join(targetBundle, execName)
	out, err := exec.Command(clientExecutable, targetBundle).CombinedOutput()
	log.Println("client output: ", string(out))
	if err != nil {
		return fmt.Errorf("failed to run client at %s: %w", clientExecutable, err)
	}
	return nil
}
