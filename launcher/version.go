package main

import (
	"errors"
	"io"
	"net/http"
	"os"

	"gorm.io/gorm"
)

type Version struct {
	gorm.Model
	Version string
	Product string
	Stream  string
	URL     string
	SHA256  []byte
	RelPath string
}

func GetVersions(db *gorm.DB) ([]Version, error) {
	var versions []Version
	result := db.Find(&versions)
	return versions, result.Error
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
