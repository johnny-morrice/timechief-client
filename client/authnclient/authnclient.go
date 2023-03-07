package authnclient

import (
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/johnny-morrice/timechief-client/log"
	"github.com/sarulabs/di/v2"
)

type Client struct {
	*client.RestClient
	Token *TokenClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.AuthnClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetAuthnClientConfig(app)
				logger := log.GetLogger(app)
				restClient := &client.RestClient{
					RawRestClient: &client.RawRestClient{
						Config: cfg.ClientConfig,
						Logger: logger,
					},
					Logger: logger,
				}
				client := &Client{
					RestClient: restClient,
					Token: &TokenClient{
						RestClient: restClient,
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

func GetAuthnClient(app di.Container) *Client {
	return app.Get(framework.AuthnClient).(*Client)
}
