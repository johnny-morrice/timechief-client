package authnclient

import (
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/sarulabs/di/v2"
)

type AuthnClientConfig struct {
	client.ClientConfig
}

func MakeAuthnClientConfig(cfg client.ClientConfig) AuthnClientConfig {
	cfg.BaseURL = cfg.BaseURL + "/authn"
	return AuthnClientConfig{ClientConfig: cfg}
}

func (cfg AuthnClientConfig) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.AuthnClientConfig,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

func GetAuthnClientConfig(app di.Container) AuthnClientConfig {
	componentAny := app.Get(framework.AuthnClientConfig)
	return componentAny.(AuthnClientConfig)
}
