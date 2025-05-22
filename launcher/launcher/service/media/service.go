package media

import (
	"errors"
	"log"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/daemon"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/video"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	defaultThemeService DefaultThemeService
	videoService        VideoService
	pictureService      PictureService
	deviceDataStore     DeviceDataStore
	kvStore             KeyValueStore
	fs                  media.FS
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

type VideoService interface {
	Exists(filename string) (bool, error)
	List() ([]video.VideoMetadata, error)
	GetPreferences() (video.Settings, error)
}

type PictureService interface {
	Exists(filename string) (bool, error)
	List() ([]picture.PictureMetadata, error)
	GetPreferences() (picture.Settings, error)
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

type DefaultThemeService interface {
	GetDefaultTheme() (v2.Theme, error)
}

func MakeService(defaultThemeService DefaultThemeService, videoService VideoService, pictureService PictureService, deviceDataStore DeviceDataStore, kvStore KeyValueStore, filesystem media.FS) (Service, error) {
	if defaultThemeService == nil {
		return Service{}, errors.New("defaultThemeService is nil")
	}
	if videoService == nil {
		return Service{}, errors.New("videoService is nil")
	}
	if pictureService == nil {
		return Service{}, errors.New("pictureService is nil")
	}
	if deviceDataStore == nil {
		return Service{}, errors.New("deviceDataStore is nil")
	}
	if kvStore == nil {
		return Service{}, errors.New("kvStore is nil")
	}
	if filesystem == nil {
		return Service{}, errors.New("filesystem is nil")
	}
	svc := Service{
		defaultThemeService: defaultThemeService,
		videoService:        videoService,
		pictureService:      pictureService,
		deviceDataStore:     deviceDataStore,
		kvStore:             kvStore,
		fs:                  filesystem,
	}
	return svc, nil
}

func (svc Service) IsThemeOverride() bool {
	setupState, err := svc.kvStore.Get("setup")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("error getting setup state for theme override check: %v", err)
		return false
	}

	if setupState != daemon.SetupFlagInternetConnected {
		log.Printf("setup state is not internet connected, theme overridde enaged")
		return true
	}

	accessToken, err := svc.kvStore.Get(store.AccessTokenKey)
	if err != nil {
		log.Printf("error getting access token for theme override check: %v", err)
		return true
	}

	if accessToken == "" {
		log.Printf("access token is empty, theme override engaged")
		return true
	}

	deviceUUID, err := svc.kvStore.Get(store.DeviceUUIDKey)
	if err != nil {
		log.Printf("error getting device UUID for theme override check: %v", err)
		return true
	}

	if deviceUUID == "" {
		log.Printf("device UUID is empty, theme override engaged")
		return true
	}

	return false
}

func (svc Service) PictureExists(filename string) (bool, error) {
	return svc.pictureService.Exists(filename)
}

func (svc Service) VideoExists(filename string) (bool, error) {
	return svc.videoService.Exists(filename)
}

func (svc Service) GetFS() media.FS {
	return svc.fs
}

func (svc Service) GetTheme() (v2.Theme, error) {
	return svc.defaultThemeService.GetDefaultTheme()
}

func (svc Service) GetMedia() (Media, error) {
	deviceData, err := svc.deviceDataStore.GetDeviceData()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return Media{}, err
	}
	myTheme := deviceData.DeviceProfile.Value.Theme
	if svc.IsThemeOverride() || deviceData.DeviceProfile.Dt == 0 || deviceData.DeviceProfile.Value.Theme.LayoutType == "" {
		defaultTheme, err := svc.defaultThemeService.GetDefaultTheme()
		if err != nil {
			return Media{}, err
		}
		myTheme = defaultTheme
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
