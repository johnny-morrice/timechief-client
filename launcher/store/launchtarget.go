package store

import (
	"fmt"
	"log"

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
