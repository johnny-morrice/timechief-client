//go:build windows

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

	systemExe := filepath.Join(installRoot, "bin/timechief-launcher.exe")

	// If an old launcher exists, delete the old launcher exe.
	err := os.Remove(systemExe)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return copyFile(targetExe, systemExe)
}

// copyFile copies a file from src to dst.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}

	err = out.Close()
	if err != nil {
		return err
	}

	return nil
}
