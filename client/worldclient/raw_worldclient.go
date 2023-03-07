package worldclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/johnny-morrice/timechief/log"
	"github.com/sarulabs/di/v2"
)

type RawClient struct {
	*client.RawRestClient
	Tz      *RawTzClient
	Locale  *RawLocaleClient
	Geocode *RawGeocodeClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawWorldClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetWorldClientConfig(app)
				restClient := &client.RawRestClient{
					Config:  cfg.ClientConfig,
					Logger:  log.GetLogger(app),
					Options: cfg.Options(),
				}
				client := &RawClient{
					RawRestClient: restClient,
					Tz: &RawTzClient{
						RawRestClient: restClient,
					},
					Locale: &RawLocaleClient{
						RawRestClient: restClient,
					},
					Geocode: &RawGeocodeClient{
						RawRestClient: restClient,
					},
				}
				return client, nil
			},
		},
	)
}

func GetRawWorldClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawWorldClient)
	return componentAny.(*RawClient)
}
