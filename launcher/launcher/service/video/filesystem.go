package video

import (
	"fmt"
	"io/fs"
	"os"
	"strings"
)

func MakeMediaFS(cfg Config) (FS, error) {
	mediaDir := cfg.GetInstallRoot() + "/media"
	fs := os.DirFS(mediaDir)
	mFS := mediaFS{
		root: mediaDir,
		fs:   fs,
	}
	return mFS, nil
}

type mediaFS struct {
	root string
	fs   fs.FS
}

func (m mediaFS) Open(name string) (fs.File, error) {
	return m.fs.Open(name)
}

func (m mediaFS) WriteFile(name string, data []byte, mode fs.FileMode) error {
	err := validateFilename(name)
	if err != nil {
		return err
	}
	return os.WriteFile(m.root+"/"+name, data, mode)
}

func validateFilename(name string) error {
	whitelist := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
	for _, c := range name {
		if !strings.ContainsRune(whitelist, c) {
			return fmt.Errorf("invalid character in filename: %c", c)
		}
	}
	return nil
}

type Config interface {
	GetInstallRoot() string
}
