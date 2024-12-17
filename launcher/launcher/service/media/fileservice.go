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

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
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

type FileMedia struct {
	Theme v2.Theme
	Media Media
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
	fileMedia := FileMedia{}
	err = json.NewDecoder(r).Decode(&fileMedia)
	if err != nil {
		return Media{}, err
	}
	media := fileMedia.Media
	themeCSS, err := renderThemeCSS(fileMedia.Theme)
	if err != nil {
		return Media{}, err
	}
	media.ThemeCSS = themeCSS
	backgroundPictureCSS, err := renderBackgroundImageCSS(backgroundImageCSSParams{
		Settings: media.BackgroundPictureMedia.Settings,
		Pictures: media.BackgroundPictureMedia.Pictures,
	})
	if err != nil {
		return Media{}, err
	}
	media.BackgroundPictureMedia.BackgroundPictureCSS = backgroundPictureCSS
	return media, nil
}
