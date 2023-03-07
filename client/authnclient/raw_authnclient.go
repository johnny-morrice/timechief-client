package authnclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/johnny-morrice/timechief/log"
	"github.com/sarulabs/di/v2"
)

type RawClient struct {
	*client.RawRestClient
	Token *RawTokenClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawAuthnClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetAuthnClientConfig(app)
				restClient := &client.RawRestClient{
					Config: cfg.ClientConfig,
					Logger: log.GetLogger(app),
				}
				client := &RawClient{
					RawRestClient: restClient,
					Token: &RawTokenClient{
						RawRestClient: restClient,
					},
				}
				return client, nil
			},
		},
	)
}

func GetRawAuthnClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawAuthnClient)
	return componentAny.(*RawClient)
}
