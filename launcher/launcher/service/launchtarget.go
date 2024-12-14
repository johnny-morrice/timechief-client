package service

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/system"
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

func (lt LaunchTarget) DeleteFiles() error {
	system.Lock()
	defer system.Unlock()
	log.Printf("deleting files for launch target %s", lt.Path)
	versionPath := path.Join(lt.Path, "..")
	// Normalise the path
	versionPath, err := filepath.Abs(versionPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path for %s: %w", versionPath, err)
	}
	// Check last part of path (after last /) matches the version
	if filepath.Base(versionPath) != lt.Version.Version {
		return fmt.Errorf("BUG: expected version path base %s does not match version %s", versionPath, lt.Version.Version)
	}

	stat, err := os.Stat(versionPath)
	if err != nil {
		log.Printf("failed to stat version path, already deleted %s: %v", versionPath, err)
		return nil
	}
	if !stat.IsDir() {
		return fmt.Errorf("expected version path to be a directory: %s", versionPath)
	}

	return os.RemoveAll(versionPath)
}

func (lt LaunchTarget) Run(cfg store.Config) error {
	logFile := cfg.GetClientLogFilePath()
	return lt.Execute(cfg, "target", "run", "--target-root", lt.Path, "--log-file", logFile, "--version", lt.Version.Details())
}

func (lt LaunchTarget) Execute(cfg store.Config, args ...string) error {
	if lt.Version.Command == "" {
		return fmt.Errorf("no command specified for version %s", lt.Version.Version)
	}

	clientConfig, err := ReadClientConfig(cfg)
	if err != nil {
		return err
	}

	err = clientConfig.ExportEnv()
	if err != nil {
		return err
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

type VersionDownloader interface {
	Download(version Version, path string) error
}

func (lt LaunchTarget) Install(cfg store.Config, versionDownloader VersionDownloader, doInstallDaemon bool) error {
	system.Lock()
	defer system.Unlock()
	log.Printf("installing version %s %s %s to %s", lt.Version.Version, lt.Version.Product, lt.Version.Stream, lt.Path)
	tempFile := lt.versionTempFile()
	defer func() {
		err := os.Remove(tempFile)
		if err != nil {
			log.Printf("failed to remove temp file %s: %v", tempFile, err)
		}
	}()
	err := versionDownloader.Download(lt.Version, tempFile)
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

	width := cfg.Config["width"]
	height := cfg.Config["height"]

	if doInstallDaemon {
		log.Println("installing daemon")
		return lt.Execute(cfg, "target", "install", "--executable", lt.targetPath(), "--target-root", lt.Path, "--install-root", cfg.GetInstallRoot(), "--splash-width", width, "--splash-height", height)
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
