package media

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"os"
	"sync"
	"time"
)

type FileService struct {
	loader *fileLoader
}

type fileLoader struct {
	filePath        string
	reloadFrequency time.Duration
	lastLoaded      time.Time
	buf             bytes.Buffer
	lock            sync.Mutex
}

func (fl *fileLoader) reader() (io.Reader, error) {
	fl.lock.Lock()
	defer fl.lock.Unlock()
	if time.Since(fl.lastLoaded) < fl.reloadFrequency {
		return &fl.buf, nil
	}
	return fl.readFile()
}

func (fl *fileLoader) readFile() (io.Reader, error) {
	file, err := os.Open(fl.filePath)
	if err != nil {
		return nil, err
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close file: %v", err)
		}
	}()
	fl.buf.Reset()
	_, err = io.Copy(&fl.buf, file)
	if err != nil {
		return nil, err
	}
	fl.lastLoaded = time.Now()
	return &fl.buf, nil
}

func MakeFileService(path string, reloadFrequency time.Duration) (FileService, error) {
	if reloadFrequency <= 0 {
		return FileService{}, errors.New("reload frequency must be positive")
	}
	if path == "" {
		return FileService{}, errors.New("path must be non-empty")
	}
	svc := FileService{
		loader: &fileLoader{
			filePath:        path,
			reloadFrequency: reloadFrequency,
		},
	}
	return svc, nil
}

func (svc FileService) GetMedia() (Media, error) {
	r, err := svc.loader.reader()
	if err != nil {
		return Media{}, err
	}
	media := Media{}
	err = json.NewDecoder(r).Decode(&media)
	if err != nil {
		return Media{}, err
	}
	return media, nil
}
