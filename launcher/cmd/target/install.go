//go:build !windows

package target

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/urfave/cli/v2"
)

func Install(ctx *cli.Context) error {
	targetExe := ctx.String("executable")
	installRoot := ctx.String("install-root")

	systemExe := filepath.Join(installRoot, "bin/timechief-launcher")

	links := []link{
		{oldPath: targetExe, newPath: systemExe},
	}
	return installLinks(links)
}

type link struct {
	oldPath string
	newPath string
}

func installLinks(links []link) error {
	for _, link := range links {
		// If an old link exists, remove it.
		err := os.Remove(link.newPath)
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("failed to remove old link: %w", err)
		}

		// Symbolically link the path.
		err = os.Symlink(link.oldPath, link.newPath)
		if err != nil {
			return fmt.Errorf("failed to create link: %w", err)
		}
	}
	return nil
}
