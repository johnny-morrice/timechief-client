package apiclient

import (
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/sarulabs/di/v2"
)

type APIClientConfig struct {
	Credentials APICredentialsConfig
	client.ClientConfig
}

type APICredentialsConfig struct {
	JWT string
}

func MakeAPIClientConfig(creds APICredentialsConfig, cfg client.ClientConfig) APIClientConfig {
	cfg.BaseURL = cfg.BaseURL + "/api"
	return APIClientConfig{
		ClientConfig: cfg,
		Credentials:  creds,
	}
}

func (cfg APIClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.APIClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetAPIClientConfig(app di.Container) APIClientConfig {
	componentAny := app.Get(framework.APIClientConfig)
	return componentAny.(APIClientConfig)
}
