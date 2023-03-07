package coreclient

import (
	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/sarulabs/di/v2"
)

type CoreClientConfig struct {
	APIKey string
	client.ClientConfig
}

func MakeCoreClientConfig(apiKey string, cfg client.ClientConfig) CoreClientConfig {
	config := CoreClientConfig{
		APIKey:       apiKey,
		ClientConfig: cfg,
	}
	config.BaseURL = config.BaseURL + "/core"
	return config
}

func (config CoreClientConfig) Options() []client.RestyOptionFunc {
	return []client.RestyOptionFunc{
		func(r *resty.Request) *resty.Request {
			return r.SetAuthToken(config.APIKey)
		},
	}
}

func (cfg CoreClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.CoreClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetCoreClientConfig(app di.Container) CoreClientConfig {
	componentAny := app.Get(framework.CoreClientConfig)
	return componentAny.(CoreClientConfig)
}
