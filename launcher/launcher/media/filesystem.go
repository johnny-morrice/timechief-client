package media

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"strings"
)

func MakeMediaFS(cfg Config) (FS, error) {
	mediaDir := cfg.GetInstallRoot() + "/media"
	fs := os.DirFS(mediaDir)
	mFS := MediaFS{
		root: mediaDir,
		fs:   fs,
	}
	return mFS, nil
}

type MediaFS struct {
	root string
	fs   fs.FS
}

func (m MediaFS) Open(name string) (fs.File, error) {
	return m.fs.Open(name)
}

func (m MediaFS) WriteFile(name string, data []byte, mode fs.FileMode) error {
	err := validateFilename(name)
	if err != nil {
		return err
	}
	return os.WriteFile(m.root+"/"+name, data, mode)
}

func (m MediaFS) CheckSHA256(filename string, expected []byte) error {
	err := validateFilename(filename)
	if err != nil {
		return err
	}
	file, err := m.Open(filename)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close file: %v", err)
		}
	}()

	return nil
}

func doSHA256(r io.Reader, expected []byte) error {
	hasher := sha256.New()
	_, err := io.Copy(hasher, r)
	if err != nil {
		return fmt.Errorf("failed to hash file: %w", err)
	}
	actual := hasher.Sum(nil)
	if !bytes.Equal(actual, expected) {
		return fmt.Errorf("incorrect hash, expected %x but was %x", expected, actual)
	}
	return nil
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

type FS interface {
	fs.FS
	WriteFile(filename string, data []byte, perm fs.FileMode) error
	CheckSHA256(filename string, expected []byte) error
}
