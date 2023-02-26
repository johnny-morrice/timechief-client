package main

import (
	"os"
	"os/exec"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LaunchTarget struct {
	gorm.Model
	VersionID uint
	Version   Version
	Path      string
	IsActive  bool
}

func GetLaunchTargets(db *gorm.DB) ([]LaunchTarget, error) {
	var launchTargets []LaunchTarget
	result := db.Find(&launchTargets)
	return launchTargets, result.Error
}

func (lt LaunchTarget) Install() error {
	tempFile := lt.versionTempFile()
	err := lt.Version.Download(tempFile)
	if err != nil {
		return err
	}
	return extractTarball(tempFile, lt.Path)
}

// extractTarball shells out to the tar utility to extract a tarball.
func extractTarball(tarballPath string, destination string) error {
	return exec.Command("tar", "-xvf", tarballPath, "-C", destination).Run()
}

func (lt LaunchTarget) versionTempFile() string {
	tempDir := os.TempDir()
	fileName := "timechief-launcher-" + lt.Version.Version + "-" + uuid.New().String()
	return tempDir + "/" + fileName
}
