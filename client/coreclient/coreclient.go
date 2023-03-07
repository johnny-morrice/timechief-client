package coreclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/johnny-morrice/timechief/log"
	"github.com/sarulabs/di/v2"
)

type Client struct {
	*client.RestClient
	Clock          *ClockClient
	Info           *InfoClient
	Init           *InitClient
	Weather        *WeatherClient
	ClockPrincipal *ClockPrincipalClient
	AuthCode       *AuthCodeClient
	Pairing        *PairingClient
	Session        *SessionClient
	Calendar       *CalendarClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.CoreClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetCoreClientConfig(app)
				logger := log.GetLogger(app)
				restClient := &client.RestClient{
					RawRestClient: &client.RawRestClient{
						Config:  cfg.ClientConfig,
						Options: cfg.Options(),
						Logger:  logger,
					},
					Logger: logger,
				}
				client := &Client{
					RestClient: restClient,
					Clock: &ClockClient{
						RestClient: restClient,
					},
					Info: &InfoClient{
						Build: &InfoBuildClient{
							RestClient: restClient,
						},
					},
					Init: &InitClient{
						RestClient: restClient,
					},
					Weather: &WeatherClient{
						RestClient: restClient,
					},
					ClockPrincipal: &ClockPrincipalClient{
						RestClient: restClient,
					},
					AuthCode: &AuthCodeClient{
						RawClient: &RawAuthCodeClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
					Pairing: &PairingClient{
						RawClient: &RawPairingClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
					Session: &SessionClient{
						RawClient: &RawSessionClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
					Calendar: &CalendarClient{
						RawClient: &RawCalendarClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
				}
				return client, nil
			},
		},
	)
}

func Register(builder *di.Builder) error {
	return framework.RegisterAll(
		builder,
		RegisterRawClient,
		RegisterClient,
	)
}

func GetCoreClient(app di.Container) *Client {
	return app.Get(framework.CoreClient).(*Client)
}
