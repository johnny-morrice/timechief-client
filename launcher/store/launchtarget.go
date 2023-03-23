package store

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LaunchTarget struct {
	gorm.Model
	VersionID uint
	Version   Version `gorm:"foreignKey:VersionID"`
	Path      string
	IsActive  bool
}

type LaunchTargetStore struct {
	Db *gorm.DB
}

func (store LaunchTargetStore) GetLaunchTargets() ([]LaunchTarget, error) {
	var launchTargets []LaunchTarget
	result := store.Db.Find(&launchTargets)
	return launchTargets, result.Error
}

func (store LaunchTargetStore) GetActiveLaunchTarget() (LaunchTarget, error) {
	var launchTarget LaunchTarget
	result := store.Db.First(&launchTarget, "is_active = ?", true)
	if result.Error != nil {
		return LaunchTarget{}, result.Error
	}
	result = store.Db.First(&launchTarget.Version, launchTarget.VersionID)
	if result.Error != nil {
		return LaunchTarget{}, result.Error
	}
	return launchTarget, result.Error
}

func (store LaunchTargetStore) Save(lt *LaunchTarget) error {
	result := store.Db.Save(&lt)
	return result.Error
}

func (store LaunchTargetStore) Create(lt *LaunchTarget) error {
	log.Printf("saving launch target %s in DB", lt.Version.Version)
	result := store.Db.Create(lt)
	return result.Error
}

func (store LaunchTargetStore) SetActive(lt LaunchTarget) error {
	if lt.ID == 0 {
		return fmt.Errorf("cannot activate launch target with ID 0")
	}
	// Deactivate all other launch targets
	result := store.Db.Model(&LaunchTarget{}).Where("is_active = ?", true).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the specified launch target
	result = store.Db.Model(&LaunchTarget{}).Where("id = ?", lt.ID).Update("is_active", true)
	return result.Error
}

func (lt LaunchTarget) Run(cfg Config) error {
	logFile := filepath.Join(cfg.GetInstallRoot(), "timechief-client.log")
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

func (lt LaunchTarget) Install(cfg Config, doInstallDaemon bool) error {
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

// extractTarball shells out to the tar utility to extract a tarball.
func extractTarball(tarballPath string, destination string) error {
	log.Printf("extracting tarball %s to %s", tarballPath, destination)
	err := exec.Command("tar", "-xvf", tarballPath, "-C", destination).Run()
	if err != nil {
		return fmt.Errorf("failed to extract tarball: %w", err)
	}
	return nil
}

func (lt LaunchTarget) versionTempFile() string {
	tempDir := os.TempDir()
	fileName := "timechief-launcher-" + lt.Version.Version + "-" + uuid.New().String() + ".tar.gz"
	return tempDir + "/" + fileName
}
