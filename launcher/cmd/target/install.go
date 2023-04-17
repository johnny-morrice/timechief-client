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
	targetRoot := ctx.String("target-root")
	installRoot := ctx.String("install-root")

	systemExe := filepath.Join(installRoot, "bin/timechief-launcher")

	targetBootstrap := filepath.Join(targetRoot, "timechief-bootstrap.sh")
	systemBootstrap := filepath.Join(installRoot, "bin/timechief-bootstrap.sh")

	splashWidth := ctx.Int("splash-width")
	splashHeight := ctx.Int("splash-height")
	targetSplash := filepath.Join(targetRoot,
		fmt.Sprintf("assets/images/splash-%d-%d.png", splashWidth, splashHeight))
	systemSplash := filepath.Join(installRoot, "assets/images/splash.png")

	links := []link{
		{oldPath: targetExe, newPath: systemExe},
		{oldPath: targetSplash, newPath: systemSplash},
		{oldPath: targetBootstrap, newPath: systemBootstrap},
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
