package wwwclient

import (
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/johnny-morrice/timechief-client/client/log"
	"github.com/sarulabs/di/v2"
)

type RawClient struct {
	*client.RawRestClient
	Token          *RawTokenClient
	Auth           *RawAuthClient
	GoogleExternal *RawGoogleExternalClient
	GoogleOAuth    *RawGoogleOAuthClient
}

func RegisterRawClient(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.RawWwwClient,
			Scope: di.App,
			Build: func(app di.Container) (interface{}, error) {
				cfg := GetWwwClientConfig(app)
				restClient := &client.RawRestClient{
					Config:  cfg.ClientConfig,
					Logger:  log.GetLogger(app),
					Options: cfg.Options(),
				}
				client := &RawClient{
					RawRestClient: restClient,
					Token: &RawTokenClient{
						RawRestClient: restClient,
						Cfg:           cfg,
					},
					Auth: &RawAuthClient{
						RawRestClient: restClient,
						Cfg:           cfg,
					},
					GoogleExternal: &RawGoogleExternalClient{
						RawRestClient: restClient,
						Cfg:           cfg,
					},
					GoogleOAuth: &RawGoogleOAuthClient{
						RawRestClient: restClient,
						Cfg:           cfg,
					},
				}
				return client, nil
			},
		},
	)
}

func GetRawClient(app di.Container) *RawClient {
	componentAny := app.Get(framework.RawWwwClient)
	return componentAny.(*RawClient)
}
