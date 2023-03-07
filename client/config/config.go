package config

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/sarulabs/di/v2"
)

type Config struct {
	Logger LoggerConfig
}

type LoggerConfig struct {
	ZapPreset string
}

func (cfg Config) Register(builder *di.Builder) error {
	return builder.Add(
		di.Def{
			Name:  framework.Config,
			Scope: di.App,
			Build: func(ctn di.Container) (interface{}, error) {
				return cfg, nil
			},
		},
	)
}

const DevelopmentLogger = "development"

func PostgresDSN(host string, port int, user string, password string, db string) string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host,
		port,
		user,
		password,
		db,
	)
}

func GetConfig(app di.Container) Config {
	componentAny := app.Get(framework.Config)
	return componentAny.(Config)
}
