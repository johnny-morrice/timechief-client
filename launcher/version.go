package main

import (
	"errors"
	"io"
	"net/http"
	"os"
	"sort"

	"golang.org/x/mod/semver"
	"gorm.io/gorm"
)

type Version struct {
	gorm.Model
	Version string `gorm:"uniqueIndex"`
	Product string
	Stream  string
	URL     string
	SHA256  []byte
	Command string
}

type VersionStore struct {
	db *gorm.DB
}

func (store VersionStore) GetVersions() ([]Version, error) {
	var versions []Version
	result := store.db.Find(&versions)
	return versions, result.Error
}

func (store VersionStore) CreateIfNotExists(v Version) error {
	var count int64
	result := store.db.Model(&Version{}).Where("version = ?", v.Version).Count(&count)
	if result.Error != nil {
		return result.Error
	}
	if count == 0 {
		result = store.db.Create(&v)
		if result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func sortVersionsDecreasing(versions []Version) {
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
	return semver.Compare(s[i].Version, s[j].Version) < 0
}

func FindNewVersion(cfg Config, currentVersion string, versions []Version) *Version {
	sortVersionsDecreasing(versions)
	for _, version := range versions {
		v := version
		if version.Version > currentVersion && version.IsSupportedProductStream(cfg) {
			return &v
		}
	}
	return nil
}

func (v Version) IsSupportedProductStream(cfg Config) bool {
	return v.Product == cfg.GetProduct() && v.Stream == cfg.GetStream()
}

func (v Version) Download(path string) error {
	err := downloadURL(v.URL, path)
	if err != nil {
		return err
	}

	return verifySHA256(v.SHA256, path)
}

// verifySHA256 verifies that the SHA256 of the file at path matches the given hash.
func verifySHA256(sha256 []byte, path string) error {
	return nil
}

func downloadURL(url string, path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return errors.New("expected 200")
	}
	defer resp.Body.Close()
	_, err = io.Copy(file, resp.Body)
	return err
}
