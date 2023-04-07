//go:build windows

package service

import (
	"fmt"
	"log"
	"os/exec"

	"github.com/johnny-morrice/timechief-client/launcher/windows"
)

// extractTarball shells out to the tar utility to extract a tarball.
func extractTarball(tarballPath string, destination string) error {
	log.Printf("extracting tarball %s to %s", tarballPath, destination)
	tarballPath = windows.PathCope(tarballPath)
	destination = windows.PathCope(destination)
	log.Printf("rewrote windows paths to %s %s", tarballPath, destination)
	output, err := exec.Command("tar", "--force-local", "-xvf", tarballPath, "-C", destination).CombinedOutput()
	log.Printf("tar output: %s", output)
	if err != nil {
		return fmt.Errorf("failed to extract tarball: %w", err)
	}
	return nil
}
