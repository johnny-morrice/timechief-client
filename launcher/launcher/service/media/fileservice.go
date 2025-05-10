package media

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
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
	buf             []byte
	lock            sync.Mutex
}

type FileMedia struct {
	Theme v2.Theme `json:"theme"`
	Media Media    `json:"media"`
}

func (fl *fileLoader) reader() (io.Reader, error) {
	fl.lock.Lock()
	defer fl.lock.Unlock()
	if time.Since(fl.lastLoaded) < fl.reloadFrequency {
		return bytes.NewReader(fl.buf), nil
	}
	return fl.readFile()
}

func (fl *fileLoader) readFile() (io.Reader, error) {
	log.Printf("(re)loading media file at %s", fl.filePath)
	file, err := os.Open(fl.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open media file at %s: %w", fl.filePath, err)
	}
	defer func() {
		err := file.Close()
		if err != nil {
			log.Printf("failed to close media file at %s: %v", fl.filePath, err)
		}
	}()
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read media file at %s: %w", fl.filePath, err)
	}
	fl.buf = fileContent
	reader := bytes.NewReader(fileContent)
	fl.lastLoaded = time.Now()
	return reader, nil
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

func (svc FileService) IsThemeOverride() bool {
	return true
}

func (svc FileService) getFileMedia() (FileMedia, error) {
	r, err := svc.loader.reader()
	if err != nil {
		return FileMedia{}, err
	}
	fileMedia := FileMedia{}
	err = json.NewDecoder(r).Decode(&fileMedia)
	if err != nil {
		return FileMedia{}, fmt.Errorf("failed to decode media file at %s: %w", svc.loader.filePath, err)
	}
	return fileMedia, nil
}

func (svc FileService) GetTheme() (v2.Theme, error) {
	fileMedia, err := svc.getFileMedia()
	if err != nil {
		return v2.Theme{}, err
	}
	return fileMedia.Theme, nil
}

func (svc FileService) GetMedia() (Media, error) {
	fileMedia, err := svc.getFileMedia()
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
