package apiclient

import (
	"github.com/johnny-morrice/timechief-client/authnclient"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/johnny-morrice/timechief-client/log"
	"github.com/sarulabs/di/v2"
)

type WorldClient struct {
	Tz      *WorldTzClient
	Locale  *WorldLocaleClient
	Geocode *WorldGeocodeClient
}

type Client struct {
	*client.RestClient
	ClockData      *ClockDataAPIClient
	ClockPrincipal *ClockPrincipalAPIClient
	World          *WorldClient
	AuthCode       *AuthCodeClient
	Pairing        *PairingAPIClient
	Ping           *PingAPIClient
	Session        *SessionAPIClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.APIClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetAPIClientConfig(app)
				logger := log.GetLogger(app)
				// This pattern doesn't fit because we don't actually use the RestClient in this package.
				// Fix by introducing new library for JWT secured APIs.
				restClient := &client.RestClient{
					RawRestClient: &client.RawRestClient{
						Config: cfg.ClientConfig,
						Logger: logger,
					},
					Logger: logger,
				}

				creds := &APICredentials{
					Config:      cfg.Credentials,
					AuthnClient: authnclient.GetAuthnClient(app),
					Logger:      logger,
				}
				client := &Client{
					RestClient: restClient,
					ClockData: &ClockDataAPIClient{
						RawClient: &RawClockDataAPIClient{
							Credentials:   creds,
							RawRestClient: restClient.RawRestClient,
						},
					},
					ClockPrincipal: &ClockPrincipalAPIClient{
						RawClient: &RawClockPrincipalAPIClient{
							Credentials:   creds,
							RawRestClient: restClient.RawRestClient,
						},
					},
					AuthCode: &AuthCodeClient{
						RawClient: &RawAuthCodeClient{
							Credentials:   creds,
							RawRestClient: restClient.RawRestClient,
						},
					},
					World: &WorldClient{
						Tz: &WorldTzClient{
							RawClient: &RawWorldTzClient{
								Credentials:   creds,
								RawRestClient: restClient.RawRestClient,
							},
						},
						Locale: &WorldLocaleClient{
							RawClient: &RawWorldLocaleClient{
								Credentials:   creds,
								RawRestClient: restClient.RawRestClient,
							},
						},
						Geocode: &WorldGeocodeClient{
							RawClient: &RawWorldGeocodeClient{
								Credentials:   creds,
								RawRestClient: restClient.RawRestClient,
							},
						},
					},
					Pairing: &PairingAPIClient{
						RawClient: &RawPairingAPIClient{
							Credentials:   creds,
							RawRestClient: restClient.RawRestClient,
						},
					},
					Ping: &PingAPIClient{
						RawClient: &RawPingAPIClient{
							Credentials:   creds,
							RawRestClient: restClient.RawRestClient,
						},
					},
					Session: &SessionAPIClient{
						RawClient: &RawSessionAPIClient{
							Credentials:   creds,
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

func GetAPIClient(app di.Container) *Client {
	return app.Get(framework.APIClient).(*Client)
}
