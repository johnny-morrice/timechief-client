package store

import "gorm.io/gorm"

type StateFlag struct {
	gorm.Model
	State string
}

type StateFlagStore struct {
	Db *gorm.DB
}

func (store StateFlagStore) GetFlags() ([]string, error) {
	var flags []StateFlag
	result := store.Db.Find(&flags)
	if result.Error != nil {
		return nil, result.Error
	}
	var stateFlags []string
	for _, flag := range flags {
		stateFlags = append(stateFlags, flag.State)
	}
	return stateFlags, nil
}

func (store StateFlagStore) CreateIfNotExists(flag string) error {
	var count int64
	result := store.Db.Model(&StateFlag{}).Where("state = ?", flag).Count(&count)
	if result.Error != nil {
		return result.Error
	}
	if count == 0 {
		result = store.Db.Create(&StateFlag{State: flag})
		if result.Error != nil {
			return result.Error
		}
	}
	return nil
}
