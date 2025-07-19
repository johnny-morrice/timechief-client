package data

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/sound"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type DeviceData struct {
	client              v2.ClientInterface
	cfgStore            ConfigStore
	deviceDataStore     DeviceDataStore
	soundService        SoundService
	keyValueStore       store.KeyValueStore
	stateFlagStore      store.StateFlagStore
	requestTimeout      time.Duration
	ticker              Ticker
	defaultThemeService DefaultThemeService
}

func MakeDataDaemon(client v2.ClientInterface, deviceDataStore DeviceDataStore, soundService SoundService, keyValueStore store.KeyValueStore, stateFlagStore store.StateFlagStore, ticker Ticker, requestTimeout time.Duration, cfgStore ConfigStore, defaultThemeService DefaultThemeService) DeviceData {
	return DeviceData{
		client:              client,
		deviceDataStore:     deviceDataStore,
		soundService:        soundService,
		keyValueStore:       keyValueStore,
		cfgStore:            cfgStore,
		stateFlagStore:      stateFlagStore,
		requestTimeout:      requestTimeout,
		ticker:              ticker,
		defaultThemeService: defaultThemeService,
	}
}

type Ticker interface {
	Tick() <-chan struct{}
	Poke()
}

type ConfigStore interface {
	SetConfig(cfg store.Config) error
	GetConfig() (store.Config, error)
}

type SoundService interface {
	SetMuteOptions(options sound.MuteOptions) error
}

type DeviceDataStore interface {
	SetDeviceData(data v2.Data) error
	GetDeviceData() (v2.Data, error)
}

type DefaultThemeService interface {
	GetDefaultTheme() (v2.Theme, error)
}

func (dd DeviceData) Start(ctx *cli.Context) {
	err := dd.doTick(ctx)
	if err != nil {
		log.Printf("device data daemon tick error: %s", err)
	}
	for range dd.ticker.Tick() {
		err := dd.doTick(ctx)
		if err != nil {
			log.Printf("device data daemon tick error: %s", err)
		}
	}
}

func (dd DeviceData) initialise() error {
	deviceData, err := dd.deviceDataStore.GetDeviceData()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("error getting device data when initialising: %w", err)
	}

	if deviceData.DeviceProfile.Dt == 0 || !deviceData.DeviceProfile.Value.Theme.IsUserSetTheme {
		log.Printf("setting default theme on initialisation")
		defaultTheme, err := dd.defaultThemeService.GetDefaultTheme()
		if err != nil {
			return fmt.Errorf("failed to get default theme: %w", err)
		}
		deviceData.DeviceProfile.Value.Theme = defaultTheme
		deviceData.DataVersion = ""

		err = dd.setDeviceData(deviceData)
		if err != nil {
			return fmt.Errorf("error setting initial device data: %w", err)
		}

		width := deviceData.DeviceProfile.Value.Theme.DisplayWidth
		height := deviceData.DeviceProfile.Value.Theme.DisplayHeight
		err = dd.updateDisplaySize(width, height)
		if err != nil {
			return err
		}
	}

	return nil
}

func (dd DeviceData) doTick(_ *cli.Context) error {
	err := dd.initialise()
	if err != nil {
		return fmt.Errorf("device data daemon initialisation error")
	}

	log.Println("downloading device data")
	data, err := dd.FetchLatest()
	if err != nil {
		return err
	}

	lastGoodDataText, err := dd.keyValueStore.Get("device-data-last-good")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("error reading device-data-last-good: %w", err)
	}

	var lastGoodDataTime time.Time
	if lastGoodDataText != "" {
		lastGoodDataTime, err = time.Parse(time.RFC3339, lastGoodDataText)
		if err != nil {
			return fmt.Errorf("error parsing device-data-last-good: %w", err)
		}
	}

	const goodDataTimeout = time.Second * 180
	expectCalendar := data.DeviceProfile.Value.Features.GoogleCalendar
	if time.Since(lastGoodDataTime) < goodDataTimeout {
		expectedWeather := data.DeviceProfile.Value.Features.OpenWeatherMap
		badData := expectCalendar && data.GoogleCalendar.Dt == 0
		badData = badData || (expectedWeather && data.Owm.Dt == 0)
		if badData {
			return fmt.Errorf("bad data from service, expected more features")
		}
	}

	const calendarErrorTimeout = 35 * time.Minute
	lastUpdated := time.Unix(data.GoogleCalendar.Value.Dt, 0)
	if expectCalendar && time.Since(lastUpdated) > calendarErrorTimeout {
		myErr := dd.stateFlagStore.CreateIfNotExists(CalendarErrorState)
		if myErr != nil {
			log.Printf("error setting calendar error state: %s", myErr)
		}
	} else {
		myErr := dd.stateFlagStore.Delete(CalendarErrorState)
		if myErr != nil {
			log.Printf("error clearing calendar error state: %s", myErr)
		}
	}

	err = dd.keyValueStore.Set("device-data-last-good", time.Now().Format(time.RFC3339))
	if err != nil {
		log.Printf("error setting last good data time")
	}

	err = dd.setDeviceData(data)
	if err != nil {
		return err
	}

	width := data.DeviceProfile.Value.Theme.DisplayWidth
	height := data.DeviceProfile.Value.Theme.DisplayHeight
	err = dd.updateDisplaySize(width, height)
	if err != nil {
		return err
	}
	err = dd.setSoundOptions(data)
	if err != nil {
		return err
	}

	return nil
}

var DeviceDataErrorState = "device-data-error"
var CalendarErrorState = "calendar-error"

var ErrBadData = errors.New("bad data")

func (dd DeviceData) FetchLatest() (v2.Data, error) {
	lastDeviceData, err := dd.deviceDataStore.GetDeviceData()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return v2.Data{}, fmt.Errorf("error getting device data when for fetch: %w", err)
	}

	newDeviceData, err := dd.doFetchLatest(lastDeviceData.DataVersion)
	if err != nil {
		log.Printf("error fetching latest device data, setting error state, using last device data: %s", err)
		myErr := dd.stateFlagStore.CreateIfNotExists(DeviceDataErrorState)
		if myErr != nil {
			log.Printf("error setting device data error state: %s", myErr)
		}
		lastDeviceData.DataVersion = ""

		err = dd.setDeviceData(lastDeviceData)
		if err != nil {
			log.Printf("error wiping data version after error: %s", err)
		}
		return v2.Data{}, err
	}

	myErr := dd.stateFlagStore.Delete(DeviceDataErrorState)
	if myErr != nil {
		log.Printf("error clearing device data error state: %s", myErr)
	}

	if newDeviceData.DataVersion == lastDeviceData.DataVersion {
		smuggledTime := int(time.Now().Unix())
		if lastDeviceData.GoogleCalendar.Dt != 0 {
			lastDeviceData.GoogleCalendar.Dt = smuggledTime
		}
		if lastDeviceData.Owm.Dt != 0 {
			lastDeviceData.Owm.Dt = smuggledTime
		}
		if lastDeviceData.DeviceProfile.Dt != 0 {
			lastDeviceData.DeviceProfile.Dt = smuggledTime
		}
		if lastDeviceData.BucketFiles.Dt != 0 {
			lastDeviceData.BucketFiles.Dt = smuggledTime
		}
		if lastDeviceData.GoogleProfile.Dt != 0 {
			lastDeviceData.GoogleProfile.Dt = smuggledTime
		}
		if lastDeviceData.SpookyCampaign.Dt != 0 {
			lastDeviceData.SpookyCampaign.Dt = smuggledTime
		}

		return lastDeviceData, nil
	}

	return newDeviceData, nil
}

func (dd DeviceData) setDeviceData(data v2.Data) error {
	if data.DeviceProfile.Value.Theme.LayoutType == "" {
		theme, err := dd.defaultThemeService.GetDefaultTheme()
		if err != nil {
			return fmt.Errorf("error getting default theme: %w", err)
		}
		data.DeviceProfile.Value.Theme = theme
	}
	return dd.deviceDataStore.SetDeviceData(data)
}

func (dd DeviceData) doFetchLatest(dataVersion string) (v2.Data, error) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, dd.requestTimeout)
	defer cancel()
	deviceUUID, err := dd.keyValueStore.Get(store.DeviceUUIDKey)
	if err != nil {
		return v2.Data{}, fmt.Errorf("error getting device uuid: %w", err)
	}

	params := v2.GetDataByDeviceUUIDParams{}
	if dataVersion != "" {
		params.DataVersion = &dataVersion
	}

	resp, err := dd.client.GetDataByDeviceUUID(ctx, deviceUUID, &params)
	if err != nil {
		return v2.Data{}, fmt.Errorf("error getting device data: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return v2.Data{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	var result v2.Data
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return v2.Data{}, fmt.Errorf("error decoding device data: %w", err)
	}

	return result, nil
}

func (dd DeviceData) updateDisplaySize(width, height int) error {
	if width == 0 || height == 0 {
		// log.Printf("skipping update display size due to 0 width or height")
		return nil
	}
	// log.Printf("setting display size to %dx%d", width, height)
	cfg, err := dd.cfgStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config to set display size: %w", err)
	}

	widthText := strconv.Itoa(width)
	heightText := strconv.Itoa(height)

	if cfg.Config["width"] == widthText && cfg.Config["height"] == heightText {
		return nil
	}

	cfg.Config["width"] = widthText
	cfg.Config["height"] = heightText

	err = dd.cfgStore.SetConfig(cfg)
	if err != nil {
		return fmt.Errorf("failed to set config for display size change: %w", err)
	}
	return nil
}

// TODO These are unused but muting is working.. what is happening?
func (dd DeviceData) setSoundOptions(data v2.Data) error {
	muteOptions, err := makeSoundOptions(data.DeviceProfile.Value)
	if err != nil {
		return err
	}
	return dd.soundService.SetMuteOptions(muteOptions)
}

func makeSoundOptions(profile v2.DeviceProfile) (sound.MuteOptions, error) {
	var muteOptions sound.MuteOptions
	muteOptions.IsMute = profile.Device.IsMuted
	muteOptions.IsMuteRange = profile.Device.IsMuteRange
	if muteOptions.IsMuteRange {
		muteOptions.MuteStartHour = uint(profile.Device.MuteHourStart)
		muteOptions.MuteEndHour = uint(profile.Device.MuteHourEnd)
	}
	return muteOptions, nil
}
