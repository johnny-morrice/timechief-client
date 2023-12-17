package daemon

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/johnny-morrice/timechief-client/client/apiclient"
	"github.com/johnny-morrice/timechief-client/client/authnclient"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"github.com/urfave/cli/v2"
)

type DeviceData struct {
	DeviceDataStore DeviceDataStore
	CfgStore        store.ConfigStore
	KeyValueStore   store.KeyValueStore
	StateFlagStore  store.StateFlagStore
	RequestTimeout  time.Duration
	RefreshInterval time.Duration
}

type DeviceDataStore interface {
	SetDeviceData(data v2.Data) error
}

func (dd DeviceData) Start(ctx *cli.Context) {
	err := dd.doTick(ctx)
	if err != nil {
		log.Printf("device data daemon tick error: %s", err)
	}
	runEvery(dd.RefreshInterval, func() {
		err := dd.doTick(ctx)
		if err != nil {
			log.Printf("device data daemon tick error: %s", err)
		}
	})
}

func (dd DeviceData) doTick(ctx *cli.Context) error {
	log.Println("downloading device data")
	data, err := dd.FetchLatest()
	if err != nil {
		return err
	}
	err = dd.DeviceDataStore.SetDeviceData(data)
	if err != nil {
		return err
	}
	return nil

}

var DeviceDataErrorState = "device-data-error"
var CalendarErrorState = "calendar-error"

func (dd DeviceData) FetchLatest() (v2.Data, error) {
	clockData, err := dd.doFetchLatest()
	if err != nil {
		myErr := dd.StateFlagStore.CreateIfNotExists(DeviceDataErrorState)
		if myErr != nil {
			log.Printf("error setting device data error state: %s", myErr)
		}
		return v2.Data{}, err
	}

	myErr := dd.StateFlagStore.Delete(DeviceDataErrorState)
	if myErr != nil {
		log.Printf("error clearing device data error state: %s", myErr)
	}

	if clockData.GoogleCalendar != nil && clockData.GoogleCalendar.Value != nil && clockData.GoogleCalendar.Value.Dt != nil {
		const calendarErrorTimeout = 30 * time.Minute
		lastUpdated := time.Unix(*clockData.GoogleCalendar.Value.Dt, 0)
		now := time.Now()
		if now.Sub(lastUpdated) > calendarErrorTimeout {
			myErr := dd.StateFlagStore.CreateIfNotExists(CalendarErrorState)
			if myErr != nil {
				log.Printf("error setting calendar error state: %s", myErr)
			}
		} else {
			myErr := dd.StateFlagStore.Delete(CalendarErrorState)
			if myErr != nil {
				log.Printf("error clearing calendar error state: %s", myErr)
			}
		}
	}

	return clockData, nil
}

func (dd DeviceData) doFetchLatest() (v2.Data, error) {
	// cfg, err := dd.CfgStore.GetConfig()
	// if err != nil {
	// 	return v2.Data{}, err
	// }

	// v2.NewClient(cfg.GetAPIBaseURL())

	panic("not implemented")
}

func (dd DeviceData) saveToken(token string) error {
	err := dd.KeyValueStore.Set(store.AccessTokenKey, token)
	if err != nil {
		return fmt.Errorf("error saving access token: %s", err)
	}
	return nil
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
	ctx, cancel := context.WithTimeout(ctx, dd.RequestTimeout)
	return ctx, cancel
}
