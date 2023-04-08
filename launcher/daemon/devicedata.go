package daemon

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/johnny-morrice/timechief-client/client/apiclient"
	"github.com/johnny-morrice/timechief-client/client/authnclient"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/client/serviceclient"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

type DeviceData struct {
	DeviceDataStore store.DeviceDataStore
	CfgStore        store.ConfigStore
	RequestTimeout  time.Duration
	RefreshInterval time.Duration
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

func (dd DeviceData) FetchLatest() (viewmodel.ClockData, error) {
	cfg, err := dd.CfgStore.GetConfig()
	if err != nil {
		return viewmodel.ClockData{}, err
	}

	credentials, err := cfg.GetDeviceCredentials()
	if err != nil {
		return viewmodel.ClockData{}, err
	}

	authnClient, err := serviceclient.MakeAuthnClient(cfg)
	if err != nil {
		return viewmodel.ClockData{}, err
	}

	token, err := dd.getToken(authnClient, cfg, credentials)

	if err != nil {
		return viewmodel.ClockData{}, err
	}

	err = dd.saveToken(token)

	if err != nil {
		return viewmodel.ClockData{}, err
	}

	apiClient, err := serviceclient.MakeAPIClient(cfg, token)
	if err != nil {
		return viewmodel.ClockData{}, err
	}

	clockData, err := dd.getClockData(apiClient)

	if err != nil {
		return viewmodel.ClockData{}, err
	}

	return *clockData, nil
}

func (dd DeviceData) saveToken(token string) error {
	cfg, err := dd.CfgStore.GetConfig()
	if err != nil {
		return err
	}

	cfg.SetAccessToken(token)

	err = dd.CfgStore.SetConfig(cfg)
	if err != nil {
		return err
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

func (dd DeviceData) getToken(authnClient *authnclient.Client, cfg store.Config, credentials string) (string, error) {
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
