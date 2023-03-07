package publicclient

import (
	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/sarulabs/di/v2"
)

type PublicClientConfig struct {
	APIKey string
	client.ClientConfig
}

func MakePublicClientConfig(apiKey string, cfg client.ClientConfig) PublicClientConfig {
	config := PublicClientConfig{
		ClientConfig: cfg,
	}
	config.BaseURL = config.BaseURL + "/public"
	return config
}

func (config PublicClientConfig) Options() []client.RestyOptionFunc {
	return []client.RestyOptionFunc{
		func(r *resty.Request) *resty.Request {
			return r
		},
	}
}

func (cfg PublicClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.PublicClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetPublicClientConfig(app di.Container) PublicClientConfig {
	componentAny := app.Get(framework.PublicClientConfig)
	return componentAny.(PublicClientConfig)
}
