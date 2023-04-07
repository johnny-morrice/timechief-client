//go:build !windows

package target

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/urfave/cli/v2"
)

func Install(ctx *cli.Context) error {
	targetExe := ctx.String("executable")
	installRoot := ctx.String("install-root")

	systemExe := filepath.Join(installRoot, "bin/timechief-launcher")

	// If an old launcher exists, delete the old launcher exe.
	err := os.Remove(systemExe)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	// Symbolically link the new launcher exe to the old location.
	err = os.Symlink(targetExe, systemExe)
	if err != nil {
		return err
	}
	return nil
}
