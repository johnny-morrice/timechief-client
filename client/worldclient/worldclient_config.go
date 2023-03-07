package worldclient

import (
	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/sarulabs/di/v2"
)

type WorldClientConfig struct {
	APIKey string
	client.ClientConfig
}

func MakeWorldClientConfig(apiKey string, cfg client.ClientConfig) WorldClientConfig {
	config := WorldClientConfig{
		APIKey:       apiKey,
		ClientConfig: cfg,
	}
	config.BaseURL = config.BaseURL + "/world"
	return config
}

func (config WorldClientConfig) Options() []client.RestyOptionFunc {
	return []client.RestyOptionFunc{
		func(r *resty.Request) *resty.Request {
			return r.SetAuthToken(config.APIKey)
		},
	}
}

func (cfg WorldClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.WorldClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetWorldClientConfig(app di.Container) WorldClientConfig {
	componentAny := app.Get(framework.WorldClientConfig)
	return componentAny.(WorldClientConfig)
}
