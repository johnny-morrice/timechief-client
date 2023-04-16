package store

import (
	"errors"
	"fmt"
	"log"
	"sort"

	"golang.org/x/mod/semver"
	"gorm.io/gorm"
)

type Version struct {
	gorm.Model
	UUID    string `gorm:"uniqueIndex:uuid_idx"`
	Version string `gorm:"uniqueIndex:version_product_stream_idx"`
	Product string `gorm:"uniqueIndex:version_product_stream_idx"`
	Stream  string `gorm:"uniqueIndex:version_product_stream_idx"`
	URL     string
	SHA256  []byte
	Command string
}

type VersionStore struct {
	Db *gorm.DB
}

func (store VersionStore) GetVersions() ([]Version, error) {
	var versions []Version
	result := store.Db.Find(&versions)
	return versions, result.Error
}

func (store VersionStore) CreateIfNotExists(v *Version) error {
	// log.Printf("creating version %s if not exists with UUID %s", v.Version, v.UUID)
	var count int64
	result := store.Db.Model(&Version{}).Where("uuid = ?", v.UUID).Count(&count)
	if result.Error != nil {
		return result.Error
	}
	if count == 0 {
		log.Printf("creating version %s", v.Version)
		result = store.Db.Create(v)
		if result.Error != nil {
			return result.Error
		}
	}
	// log.Printf("version %s exists", v.Version)
	return nil
}

func SortVersionsDecreasing(versions []Version) {
	sort.Sort(sort.Reverse(bySemVer(versions)))
}

type bySemVer []Version

func (s bySemVer) Len() int {
	return len(s)
}

func (s bySemVer) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s bySemVer) Less(i, j int) bool {
	if !semver.IsValid(s[i].Version) && !semver.IsValid(s[j].Version) {
		log.Printf("Invalid semver: %s, %s", s[i].Version, s[j].Version)
		return false
	}
	if !semver.IsValid(s[i].Version) {
		log.Printf("Invalid semver: %s", s[i].Version)
		return true
	}
	if !semver.IsValid(s[j].Version) {
		log.Printf("Invalid semver: %s", s[j].Version)
		return false
	}
	return semver.Compare(s[i].Version, s[j].Version) < 0
}

var ErrNoVersion = errors.New("no version found")

func FindNewVersion(cfg Config, currentVersion string, versions []Version) (Version, error) {
	SortVersionsDecreasing(versions)
	for _, version := range versions {
		v := version
		isGt := semver.Compare(version.Version, currentVersion) > 0
		if isGt && version.IsSupportedProductStream(cfg) {
			return v, nil
		}
	}
	return Version{}, ErrNoVersion
}

func FindLatestVersion(cfg Config, versions []Version) (Version, error) {
	SortVersionsDecreasing(versions)
	for _, version := range versions {
		v := version
		if version.IsSupportedProductStream(cfg) {
			return v, nil
		}
	}
	return Version{}, ErrNoVersion
}

func (v Version) IsSupportedProductStream(cfg Config) bool {
	return v.Product == cfg.GetProduct() && v.Stream == cfg.GetStream()
}

func (v Version) Details() string {
	return fmt.Sprintf("%s %s %s", v.Product, v.Stream, v.Version)
}
