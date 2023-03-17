package publicclient

import (
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/johnny-morrice/timechief-client/client/log"
	"github.com/sarulabs/di/v2"
)

type Client struct {
	*client.RestClient
	Version *VersionClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.PublicClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetPublicClientConfig(app)
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
					Version: &VersionClient{
						RestClient: restClient,
					},
				}
				return client, nil
			},
		},
	)
}

func GetClient(app di.Container) *Client {
	return app.Get(framework.PublicClient).(*Client)
}
