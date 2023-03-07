package store

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
	return launchTarget, result.Error
}

func (store LaunchTargetStore) Save(lt LaunchTarget) error {
	result := store.Db.Save(&lt)
	return result.Error
}

func (store LaunchTargetStore) Create(lt LaunchTarget) error {
	result := store.Db.Create(&lt)
	return result.Error
}

func (store LaunchTargetStore) SetActive(lt LaunchTarget) error {
	// Deactivate all other launch targets
	result := store.Db.Model(&LaunchTarget{}).Where("is_active = ?", true).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the specified launch target
	result = store.Db.Model(&lt).Update("is_active", true)
	return result.Error
}

func (lt LaunchTarget) Launch() error {
	return exec.Command(lt.Path + "/" + lt.Version.Command).Run()
}

func (lt LaunchTarget) Install(cfg Config) error {
	tempFile := lt.versionTempFile()
	err := lt.Version.Download(cfg, tempFile)
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
