package daemon

import (
	"context"
	"errors"
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
}

func (dd DeviceData) Start(ctx *cli.Context) {
	dd.doTick(ctx)
	const interval = time.Second * 15
	runEvery(interval, func() { dd.doTick(ctx) })
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

	token, err := getToken(authnClient, cfg, credentials)

	if err != nil {
		return viewmodel.ClockData{}, err
	}

	apiClient, err := serviceclient.MakeAPIClient(cfg, token)
	if err != nil {
		return viewmodel.ClockData{}, err
	}

	clockData, err := getClockData(apiClient)

	if err != nil {
		return viewmodel.ClockData{}, err
	}

	return *clockData, nil
}

func getClockData(apiClient *apiclient.Client) (*viewmodel.ClockData, error) {
	// TODO make timeout configurable
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*15)
	defer cancel()
	clockData, err := apiClient.ClockData.GetClockData(ctx)

	if err != nil {
		return nil, err
	}

	return clockData, nil
}

func getToken(authnClient *authnclient.Client, cfg store.Config, credentials string) (string, error) {
	credentialParts := strings.Split(credentials, ":")
	if len(credentialParts) != 2 {
		return "", errors.New("expected device credentials to be in form serial:secret")
	}

	serial := credentialParts[0]
	secret := credentialParts[1]

	// TODO make timeout configurable
	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*15)
	defer cancel()
	tokenResp, err := authnClient.Token.CreateToken(ctx, &viewmodel.TokenRequest{
		DeviceSerial: serial,
		DeviceSecret: secret,
	})

	if err != nil {
		return "", err
	}

	return tokenResp.JWT, nil
}
