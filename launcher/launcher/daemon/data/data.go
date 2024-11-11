package data

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/johnny-morrice/timechief-client/client/apiclient"
	"github.com/johnny-morrice/timechief-client/client/authnclient"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/sound"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

type DeviceData struct {
	client          v2.ClientInterface
	deviceDataStore DeviceDataStore
	soundService    SoundService
	keyValueStore   store.KeyValueStore
	stateFlagStore  store.StateFlagStore
	requestTimeout  time.Duration
	ticker          Ticker
}

func MakeDataDaemon(client v2.ClientInterface, deviceDataStore DeviceDataStore, soundService SoundService, keyValueStore store.KeyValueStore, stateFlagStore store.StateFlagStore, ticker Ticker, requestTimeout time.Duration) DeviceData {
	return DeviceData{
		client:          client,
		deviceDataStore: deviceDataStore,
		soundService:    soundService,
		keyValueStore:   keyValueStore,
		stateFlagStore:  stateFlagStore,
		requestTimeout:  requestTimeout,
		ticker:          ticker,
	}
}

type Ticker interface {
	Tick() <-chan struct{}
	Poke()
}

type SoundService interface {
	SetMuteOptions(options sound.MuteOptions) error
}

type DeviceDataStore interface {
	SetDeviceData(data v2.Data) error
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

func (dd DeviceData) doTick(_ *cli.Context) error {
	log.Println("downloading device data")
	data, err := dd.FetchLatest()
	if err != nil {
		return err
	}

	lastGoodDataText, err := dd.keyValueStore.Get("device-data-last-good")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("error reading device-data-last-good: %w", err)
	}

	var lastGoodData time.Time
	if lastGoodDataText != "" {
		lastGoodData, err = time.Parse(time.RFC3339, lastGoodDataText)
		if err != nil {
			return fmt.Errorf("error parsing device-data-last-good: %w", err)
		}
	}

	const timeout = time.Second * 180

	expectCalendar := data.DeviceProfile.Value.Features.GoogleCalendar
	if time.Since(lastGoodData) < timeout {

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

	err = dd.deviceDataStore.SetDeviceData(data)
	if err != nil {
		return err
	}
	return nil
}

var DeviceDataErrorState = "device-data-error"
var CalendarErrorState = "calendar-error"

var ErrBadData = errors.New("bad data")

func (dd DeviceData) FetchLatest() (v2.Data, error) {
	clockData, err := dd.doFetchLatest()
	if err != nil {
		myErr := dd.stateFlagStore.CreateIfNotExists(DeviceDataErrorState)
		if myErr != nil {
			log.Printf("error setting device data error state: %s", myErr)
		}
		return v2.Data{}, err
	}

	myErr := dd.stateFlagStore.Delete(DeviceDataErrorState)
	if myErr != nil {
		log.Printf("error clearing device data error state: %s", myErr)
	}

	return clockData, nil
}

func (dd DeviceData) doFetchLatest() (v2.Data, error) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, dd.requestTimeout)
	defer cancel()
	deviceUUID, err := dd.keyValueStore.Get(store.DeviceUUIDKey)
	if err != nil {
		return v2.Data{}, fmt.Errorf("error getting device uuid: %w", err)
	}
	resp, err := dd.client.GetDataByDeviceUUID(ctx, deviceUUID)
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

func (dd DeviceData) getClockData(apiClient *apiclient.Client) (*viewmodel.ClockData, error) {
	ctx, cancel := dd.newClientContext()
	defer cancel()
	clockData, err := apiClient.ClockData.GetClockData(ctx)

	if err != nil {
		return nil, err
	}

	return clockData, nil
}

func (dd DeviceData) getToken(authnClient *authnclient.Client, credentials string) (string, error) {
	credentialParts := strings.Split(credentials, ":")
	if len(credentialParts) != 2 {
		return "", errors.New("expected device credentials to be in form serial:secret")
	}

	serial := credentialParts[0]
	secret := credentialParts[1]

	ctx, cancel := dd.newClientContext()
	defer cancel()
	tokenResp, err := authnClient.Token.CreateToken(ctx, &viewmodel.TokenRequest{
		DeviceSerial: serial,
		DeviceSecret: secret,
		Scopes:       []string{"clock-data:read", "pairing:get", "pairing:create", "pairing:complete"},
		TokenPolicy:  viewmodel.DevicePolicy,
	})

	if err != nil {
		return "", err
	}

	return tokenResp.JWT, nil
}

func (dd DeviceData) newClientContext() (context.Context, func()) {
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, dd.requestTimeout)
	return ctx, cancel
}

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
