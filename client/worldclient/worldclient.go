package worldclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/johnny-morrice/timechief/log"
	"github.com/sarulabs/di/v2"
)

type Client struct {
	*client.RestClient
	Tz      *TzClient
	Locale  *LocaleClient
	Geocode *GeocodeClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.WorldClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetWorldClientConfig(app)
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
					Tz: &TzClient{
						RawClient: &RawTzClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
					Locale: &LocaleClient{
						RawClient: &RawLocaleClient{
							RawRestClient: restClient.RawRestClient,
						},
					},
					Geocode: &GeocodeClient{
						RawClient: &RawGeocodeClient{
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

func GetWorldClient(app di.Container) *Client {
	return app.Get(framework.WorldClient).(*Client)
}
