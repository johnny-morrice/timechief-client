package publicclient

import (
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/johnny-morrice/timechief-client/client/log"
	"github.com/sarulabs/di/v2"
)

type RawClient struct {
	*client.RawRestClient
	Version *RawVersionClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawPublicClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetPublicClientConfig(app)
				restClient := &client.RawRestClient{
					Config:  cfg.ClientConfig,
					Logger:  log.GetLogger(app),
					Options: cfg.Options(),
				}
				client := &RawClient{
					RawRestClient: restClient,
					Version:       &RawVersionClient{RawRestClient: restClient},
				}
				return client, nil
			},
		},
	)
}

func GetRawClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawPublicClient)
	return componentAny.(*RawClient)
}
