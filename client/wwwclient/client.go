package wwwclient

import (
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/johnny-morrice/timechief-client/log"
	"github.com/sarulabs/di/v2"
)

type Client struct {
	*client.RestClient
	Auth           *AuthClient
	Token          *TokenClient
	GoogleExternal *GoogleExternalClient
	GoogleOAuth    *GoogleOAuthClient
}

func RegisterClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.WwwClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetWwwClientConfig(app)
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
					Auth: &AuthClient{
						RawClient: &RawAuthClient{
							RawRestClient: restClient.RawRestClient,
							Cfg:           cfg,
						},
					},
					Token: &TokenClient{
						RawClient: &RawTokenClient{
							RawRestClient: restClient.RawRestClient,
							Cfg:           cfg,
						},
					},
					GoogleOAuth: &GoogleOAuthClient{
						RawClient: &RawGoogleOAuthClient{
							RawRestClient: restClient.RawRestClient,
							Cfg:           cfg,
						},
					},
					GoogleExternal: &GoogleExternalClient{
						RawClient: &RawGoogleExternalClient{
							RawRestClient: restClient.RawRestClient,
							Cfg:           cfg,
						},
					},
				}
				return client, nil
			},
		},
	)
}

func GetClient(app di.Container) *Client {
	return app.Get(framework.WwwClient).(*Client)
}
