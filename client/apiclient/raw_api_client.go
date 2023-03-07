package apiclient

import (
	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/authnclient"
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/johnny-morrice/timechief-client/client/log"
	"github.com/sarulabs/di/v2"
	"go.uber.org/zap"
)

type APICredentials struct {
	AuthnClient *authnclient.Client
	Config      APICredentialsConfig
	Logger      *zap.Logger
}

func (creds *APICredentials) GetAuthToken() string {
	return creds.Config.JWT
}

func (creds *APICredentials) SetAuthToken(req *resty.Request) *resty.Request {
	if creds.Config.JWT != "" {
		return req.SetAuthToken(creds.Config.JWT)
	}
	creds.Logger.Warn("no jwt for api call")
	return req
}

type RawWorldClient struct {
	Tz      *RawWorldTzClient
	Locale  *RawWorldLocaleClient
	Geocode *RawWorldGeocodeClient
}

type RawClient struct {
	*client.RawRestClient
	Credentials    *APICredentials
	ClockData      *RawClockDataAPIClient
	ClockPrincipal *RawClockPrincipalAPIClient
	World          *RawWorldClient
	AuthCode       *RawAuthCodeClient
	Pairing        *RawPairingAPIClient
	Ping           *RawPingAPIClient
	Session        *RawSessionAPIClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawAPIClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				logger := log.GetLogger(app)
				cfg := GetAPIClientConfig(app)
				restClient := &client.RawRestClient{
					Config: cfg.ClientConfig,
					Logger: logger,
				}
				creds := &APICredentials{
					Config:      cfg.Credentials,
					AuthnClient: authnclient.GetAuthnClient(app),
					Logger:      logger,
				}
				client := &RawClient{
					Credentials:   creds,
					RawRestClient: restClient,
					ClockData: &RawClockDataAPIClient{
						Credentials:   creds,
						RawRestClient: restClient,
					},
					ClockPrincipal: &RawClockPrincipalAPIClient{
						Credentials:   creds,
						RawRestClient: restClient,
					},
					AuthCode: &RawAuthCodeClient{
						Credentials:   creds,
						RawRestClient: restClient,
					},
					World: &RawWorldClient{
						Tz: &RawWorldTzClient{
							Credentials:   creds,
							RawRestClient: restClient,
						},
						Locale: &RawWorldLocaleClient{
							Credentials:   creds,
							RawRestClient: restClient,
						},
						Geocode: &RawWorldGeocodeClient{
							Credentials:   creds,
							RawRestClient: restClient,
						},
					},
					Pairing: &RawPairingAPIClient{
						RawRestClient: restClient,
						Credentials:   creds,
					},
					Ping: &RawPingAPIClient{
						RawRestClient: restClient,
						Credentials:   creds,
					},
					Session: &RawSessionAPIClient{
						RawRestClient: restClient,
						Credentials:   creds,
					},
				}
				return client, nil
			},
		},
	)
}

func GetRawAPIClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawAPIClient)
	return componentAny.(*RawClient)
}
