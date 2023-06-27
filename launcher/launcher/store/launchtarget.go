package store

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

type LaunchTarget struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	VersionID uint
	Version   Version `gorm:"foreignKey:VersionID"`
	Path      string
	IsActive  bool
}

type LaunchTargetStore struct {
	DB *gorm.DB
}

func (store LaunchTargetStore) List() ([]LaunchTarget, error) {
	var launchTargets []LaunchTarget
	result := store.DB.Find(&launchTargets)
	return launchTargets, result.Error
}

func (store LaunchTargetStore) ListGarbage(keep int) ([]LaunchTarget, error) {
	_, err := store.GetActiveLaunchTarget()
	if err != nil {
		return nil, err
	}
	const query = `SELECT * FROM launch_targets WHERE is_active = 0 AND id NOT IN (SELECT id FROM launch_targets WHERE is_active = 0 ORDER BY updated_at DESC LIMIT ?);`
	var launchTargets []LaunchTarget
	result := store.DB.Raw(query, keep).Scan(&launchTargets)
	return launchTargets, result.Error
}

func (store LaunchTargetStore) Delete(lt LaunchTarget) error {
	result := store.DB.Delete(&lt)
	return result.Error
}

func (store LaunchTargetStore) GetActiveLaunchTarget() (LaunchTarget, error) {
	var launchTarget LaunchTarget
	result := store.DB.First(&launchTarget, "is_active = ?", true)
	if result.Error != nil {
		return LaunchTarget{}, result.Error
	}
	result = store.DB.First(&launchTarget.Version, launchTarget.VersionID)
	if result.Error != nil {
		return LaunchTarget{}, result.Error
	}
	return launchTarget, result.Error
}

func (store LaunchTargetStore) Save(lt *LaunchTarget) error {
	result := store.DB.Save(&lt)
	return result.Error
}

func (store LaunchTargetStore) Create(lt *LaunchTarget) error {
	log.Printf("saving launch target %s in DB", lt.Version.Version)
	result := store.DB.Create(lt)
	return result.Error
}

func (store LaunchTargetStore) SetActive(lt LaunchTarget) error {
	if lt.ID == 0 {
		return fmt.Errorf("cannot activate launch target with ID 0")
	}
	// Deactivate all other launch targets
	result := store.DB.Model(&LaunchTarget{}).Where("is_active = ?", true).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	// Activate the specified launch target
	result = store.DB.Model(&LaunchTarget{}).Where("id = ?", lt.ID).Update("is_active", true)
	return result.Error
}
