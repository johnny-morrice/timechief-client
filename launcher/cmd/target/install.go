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

	splashWidth := ctx.Int("splash-width")
	splashHeight := ctx.Int("splash-height")
	targetSplash := filepath.Join(targetRoot, "timechief-client-bundle", "assets", "images",
		fmt.Sprintf("splash-%d-%d.png", splashWidth, splashHeight))
	systemSplash := filepath.Join(installRoot, "assets", "images", "splash.png")

	links := []link{
		{oldPath: targetExe, newPath: systemExe},
		{oldPath: targetSplash, newPath: systemSplash},
	}

	scripts := []string{
		"timechief-bootstrap",
		"bin/timechief-wifi-interfaces",
		"bin/timechief-internet-check",
		"bin/timechief-reboot",
		"bin/timechief-shutdown",
		"bin/timechief-wifi-connect",
		"bin/timechief-wifi-hotspot",
		"bin/timechief-wifi-interface",
		"bin/timechief-wifi-scan",
		"bin/secure/timechief-reboot",
		"bin/secure/timechief-shutdown",
		"bin/secure/timechief-wifi-connect",
		"bin/secure/timechief-wifi-hotspot",
		"bin/secure/timechief-wifi-interface",
		"bin/secure/timechief-wifi-scan",
	}

	for _, script := range scripts {
		targetScript := filepath.Join(targetRoot, "timechief-client-bundle", script)
		systemScript := filepath.Join(installRoot, script)
		links = append(links, link{oldPath: targetScript, newPath: systemScript})
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

		// Create the directory for the new link.
		dirname := filepath.Dir(link.newPath)
		err = os.MkdirAll(dirname, 0755)
		if err != nil {
			return fmt.Errorf("failed to create directory for link: %w", err)
		}

		// Symbolically link the path.
		err = os.Symlink(link.oldPath, link.newPath)
		if err != nil {
			return fmt.Errorf("failed to create link: %w", err)
		}
	}
	return nil
}
