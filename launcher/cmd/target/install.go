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

	assets := []string{
		"assets/sound/login.wav",
		"assets/sound/startup.wav",
		"assets/sound/shutdown.wav",
		"bin/timechief-bootstrap",
		"bin/timechief-wifi-interfaces",
		"bin/timechief-internet-check",
		"bin/timechief-reboot",
		"bin/timechief-shutdown",
		"bin/timechief-wifi-connect",
		"bin/timechief-wifi-hotspot",
		"bin/timechief-wifi-down-hotspot",
		"bin/timechief-wifi-interface",
		"bin/timechief-wifi-scan",
		"bin/timechief-expand-rootfs",
		"bin/timechief-firewall",
		"bin/timechief-ssh-change-passwd",
		"bin/timechief-pipewire-initialise",
		"bin/timechief-pipewire-play-file",
		"bin/secure/timechief-reboot",
		"bin/secure/timechief-shutdown",
		"bin/secure/timechief-wifi-connect",
		"bin/secure/timechief-wifi-hotspot",
		"bin/secure/timechief-wifi-down-hotspot",
		"bin/secure/timechief-wifi-interface",
		"bin/secure/timechief-wifi-scan",
		"bin/secure/timechief-pyrtc",
		"bin/secure/timechief-set-system-time",
		"bin/secure/timechief-expand-rootfs",
		"bin/secure/timechief-firewall",
		"bin/secure/timechief-ssh-change-passwd",
	}

	for _, asset := range assets {
		targetScript := filepath.Join(targetRoot, "timechief-client-bundle", asset)
		systemScript := filepath.Join(installRoot, asset)
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
