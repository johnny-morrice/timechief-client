package store

import (
	"sort"
	"time"

	"gorm.io/gorm"
)

type StateFlag struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	State     string `gorm:"uniqueIndex"`
}

type StateFlagStore struct {
	DB *gorm.DB
}

func (store StateFlagStore) List() ([]string, error) {
	var flags []StateFlag
	result := store.DB.Find(&flags)
	if result.Error != nil {
		return nil, result.Error
	}
	stateFlags := []string{}
	for _, flag := range flags {
		stateFlags = append(stateFlags, flag.State)
	}
	sort.Strings(stateFlags)
	return stateFlags, nil
}

func (store StateFlagStore) Exists(flag string) (bool, error) {
	var count int64
	result := store.DB.Model(&StateFlag{}).Where("state = ?", flag).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}

func (store StateFlagStore) CreateIfNotExists(flag string) error {
	var count int64
	result := store.DB.Model(&StateFlag{}).Where("state = ?", flag).Count(&count)
	if result.Error != nil {
		return result.Error
	}
	if count == 0 {
		result = store.DB.Create(&StateFlag{State: flag})
		if result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func (store StateFlagStore) Delete(flag string) error {
	result := store.DB.Where("state = ?", flag).Delete(&StateFlag{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (store StateFlagStore) DeleteAll() error {
	result := store.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&StateFlag{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}
