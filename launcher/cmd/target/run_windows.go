//go:build windows

package target

import (
	"fmt"
	"log"
	"os/exec"
	"path/filepath"

	"github.com/urfave/cli/v2"
)

const tarDirectory = "timechief-client-bundle"
const scriptName = "timechief-client.ps1"

func Run(ctx *cli.Context) error {
	targetRoot := ctx.String("target-root")
	logFile := ctx.String("log-file")
	version := ctx.String("version")
	targetBundle := filepath.Join(targetRoot, tarDirectory)
	script := filepath.Join(targetBundle, scriptName)
	out, err := exec.Command("powershell", script, targetBundle, logFile, version).CombinedOutput()
	log.Println("client output: ", string(out))
	if err != nil {
		return fmt.Errorf("failed to run client at %s: %w", script, err)
	}
	return nil
}
