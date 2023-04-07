package service

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type LaunchTarget struct {
	Version  Version
	Path     string
	IsActive bool
}

func LaunchTargetFromStore(storeLT store.LaunchTarget) LaunchTarget {
	return LaunchTarget{
		Version:  VersionFromStore(storeLT.Version),
		Path:     storeLT.Path,
		IsActive: storeLT.IsActive,
	}
}

func (lt LaunchTarget) Run(cfg store.Config) error {
	logFile := cfg.GetClientLogFilePath()
	return lt.Execute("target", "run", "--target-root", lt.Path, "--log-file", logFile)
}

func (lt LaunchTarget) Execute(args ...string) error {
	if lt.Version.Command == "" {
		return fmt.Errorf("no command specified for version %s", lt.Version.Version)
	}
	path := lt.targetPath()
	output, err := exec.Command(path, args...).CombinedOutput()
	log.Printf("launch target output: %s", output)
	if err != nil {
		return fmt.Errorf("failed to execute launch target at %s with args %v: %w", path, args, err)
	}
	return nil
}

func (lt LaunchTarget) targetPath() string {
	return filepath.Join(lt.Path, lt.Version.Command)
}

func (lt LaunchTarget) Install(cfg store.Config, doInstallDaemon bool) error {
	log.Printf("installing version %s to %s", lt.Version.Version, lt.Path)
	tempFile := lt.versionTempFile()
	err := lt.Version.Download(cfg, tempFile)
	if err != nil {
		return err
	}
	err = mkdirp(lt.Path)
	if err != nil {
		return err
	}
	err = extractTarball(tempFile, lt.Path)
	if err != nil {
		return err
	}

	if doInstallDaemon {
		log.Println("installing daemon")
		return lt.Execute("target", "install", "--executable", lt.targetPath(), "--target-root", lt.Path)
	}
	return nil
}

// mkdirp creates a directory and all its parents.
func mkdirp(dirpath string) error {
	log.Printf("creating directory %s", dirpath)
	err := os.MkdirAll(dirpath, 0755)
	if err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	return nil
}

func (lt LaunchTarget) versionTempFile() string {
	tempDir := os.TempDir()
	fileName := "timechief-launcher-" + lt.Version.Version + "-" + uuid.New().String() + ".tar.gz"
	return tempDir + "/" + fileName
}
