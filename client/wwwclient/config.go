package wwwclient

import (
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/sarulabs/di/v2"
)

type WwwClientConfig struct {
	client.ClientConfig
	CookieURL string
}

func MakeWwwClientConfig(cookieURL string, cfg client.ClientConfig) WwwClientConfig {
	config := WwwClientConfig{
		ClientConfig: cfg,
	}
	config.BaseURL = config.BaseURL + "/www"
	config.CookieURL = cookieURL
	return config
}

func (cfg WwwClientConfig) Options() []client.RestyOptionFunc {
	return []client.RestyOptionFunc{}
}

func (cfg WwwClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.WwwClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetWwwClientConfig(app di.Container) WwwClientConfig {
	componentAny := app.Get(framework.WwwClientConfig)
	return componentAny.(WwwClientConfig)
}
