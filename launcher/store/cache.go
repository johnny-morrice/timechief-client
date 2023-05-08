package store

import (
	"time"

	"gorm.io/gorm"
)

type CacheEntry struct {
	ID         uint
	CreatedAt  time.Time
	UpdatedAt  time.Time
	CacheTime  time.Time
	ExpireTime time.Time
	Content    string
}

type CacheStore struct {
	DB *gorm.DB
}

func (repo CacheStore) Create(content string, timeout time.Duration) error {
	entry := CacheEntry{
		CacheTime:  time.Now(),
		ExpireTime: time.Now().Add(timeout),
		Content:    content,
	}
	result := repo.DB.Create(&entry)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

// Exists returns the cached value for the given uuid.  If the cache entry has expired, it returns false.
func (repo CacheStore) Exists(content string) (bool, error) {
	var entry CacheEntry
	result := repo.DB.Where("content = ?", content).First(&entry)
	if result.Error != nil {
		return false, result.Error
	}
	if entry.ExpireTime.Before(time.Now()) {
		return false, nil
	}
	return true, nil
}

func (repo CacheStore) DeleteExpired() error {
	result := repo.DB.Where("expire_time < ?", time.Now()).Delete(&CacheEntry{})
	if result.Error != nil {
		return result.Error
	}
	return nil
}
