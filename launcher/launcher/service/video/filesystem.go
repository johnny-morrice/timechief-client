package video

import (
	"io/fs"
	"os"
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
	return os.WriteFile(m.root+"/"+name, data, mode)
}

type Config interface {
	GetInstallRoot() string
}
