package coreclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/johnny-morrice/timechief/log"
	"github.com/sarulabs/di/v2"
)

type RawClient struct {
	*client.RawRestClient
	Info           *RawInfoClient
	Clock          *RawClockClient
	Weather        *RawWeatherClient
	ClockPrincipal *RawClockPrincipalClient
	AuthCode       *RawAuthCodeClient
	Pairing        *RawPairingClient
	Session        *RawSessionClient
	Calendar       *RawCalendarClient
	Version        *RawVersionClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawCoreClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetCoreClientConfig(app)
				restClient := &client.RawRestClient{
					Config:  cfg.ClientConfig,
					Logger:  log.GetLogger(app),
					Options: cfg.Options(),
				}
				client := &RawClient{
					RawRestClient: restClient,
					Info: &RawInfoClient{
						Build: &RawInfoBuildClient{
							RawRestClient: restClient,
						},
					},
					Clock: &RawClockClient{
						RawRestClient: restClient,
					},
					Weather: &RawWeatherClient{
						RawRestClient: restClient,
					},
					ClockPrincipal: &RawClockPrincipalClient{
						RawRestClient: restClient,
					},
					AuthCode: &RawAuthCodeClient{
						RawRestClient: restClient,
					},
					Pairing: &RawPairingClient{
						RawRestClient: restClient,
					},
					Session: &RawSessionClient{
						RawRestClient: restClient,
					},
					Calendar: &RawCalendarClient{
						RawRestClient: restClient,
					},
					Version: &RawVersionClient{
						RawRestClient: restClient,
					},
				}
				return client, nil
			},
		},
	)
}

func GetRawCoreClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawCoreClient)
	return componentAny.(*RawClient)
}
