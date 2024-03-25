package media

import (
	"errors"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
	"gorm.io/gorm"
)

type Service struct {
	videoService   VideoService
	pictureService PictureService
}

type VideoService interface {
	List() ([]video.VideoMetadata, error)
	GetPreferences() (video.Settings, error)
}

type PictureService interface {
	List() ([]picture.PictureMetadata, error)
	GetPreferences() (picture.Settings, error)
}

func MakeService(videoService VideoService, pictureService PictureService) (Service, error) {
	svc := Service{
		videoService:   videoService,
		pictureService: pictureService,
	}
	return svc, nil
}

func (svc Service) GetMedia() (Media, error) {
	myTheme := defaultTheme()
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
		// Settings: pictureSettings,
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
