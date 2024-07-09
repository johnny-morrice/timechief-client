package media

import (
	"errors"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
	"gorm.io/gorm"
)

type Service struct {
	videoService    VideoService
	pictureService  PictureService
	deviceDataStore DeviceDataStore
}

type VideoService interface {
	List() ([]video.VideoMetadata, error)
	GetPreferences() (video.Settings, error)
}

type PictureService interface {
	List() ([]picture.PictureMetadata, error)
	GetPreferences() (picture.Settings, error)
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

func MakeService(videoService VideoService, pictureService PictureService, deviceDataStore DeviceDataStore) (Service, error) {
	if videoService == nil {
		return Service{}, errors.New("videoService is nil")
	}
	if pictureService == nil {
		return Service{}, errors.New("pictureService is nil")
	}
	if deviceDataStore == nil {
		return Service{}, errors.New("deviceDataStore is nil")
	}
	svc := Service{
		videoService:    videoService,
		pictureService:  pictureService,
		deviceDataStore: deviceDataStore,
	}
	return svc, nil
}

func (svc Service) GetMedia() (Media, error) {
	deviceData, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return Media{}, err
	}
	myTheme := deviceData.DeviceProfile.Value.Theme
	// Sensible default if not initialised yet
	if deviceData.DeviceProfile.Dt == 0 {
		myTheme = defaultTheme()
	}
	themeCSS, err := renderThemeCSS(myTheme)
	if err != nil {
		return Media{}, err
	}

	videos, err := svc.videoService.List()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return Media{}, err
		}
	}
	videoSettings, err := svc.videoService.GetPreferences()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return Media{}, err
		}
	}
	pictures, err := svc.pictureService.List()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return Media{}, err
		}
	}
	pictureSettings, err := svc.pictureService.GetPreferences()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return Media{}, err
		}
	}
	pictureCSS, err := renderBackgroundImageCSS(backgroundImageCSSParams{
		Settings: pictureSettings,
		Pictures: pictures,
	})
	if err != nil {
		return Media{}, err
	}

	media := Media{
		ThemeCSS: themeCSS,
		VideoMedia: VideoMedia{
			Settings: videoSettings,
			Videos:   videos,
		},
		BackgroundPictureMedia: PictureMedia{
			Settings:             pictureSettings,
			Pictures:             pictures,
			BackgroundPictureCSS: pictureCSS,
		},
	}
	return media, nil
}

type Media struct {
	ThemeCSS               string       `json:"theme_css"`
	VideoMedia             VideoMedia   `json:"video"`
	BackgroundPictureMedia PictureMedia `json:"background_picture"`
}

type VideoMedia struct {
	Settings video.Settings        `json:"settings"`
	Videos   []video.VideoMetadata `json:"videos"`
}

type PictureMedia struct {
	Settings             picture.Settings          `json:"settings"`
	Pictures             []picture.PictureMetadata `json:"pictures"`
	BackgroundPictureCSS string                    `json:"background_picture_css"`
}

type Theme struct {
	ThemeCSS string `json:"theme_css"`
}
