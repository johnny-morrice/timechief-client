package log

import (
	"github.com/johnny-morrice/timechief-client/config"
	"github.com/johnny-morrice/timechief-client/framework"
	"github.com/pkg/errors"
	"github.com/sarulabs/di/v2"
	"go.uber.org/zap"
)

func BuildLogger(cfg config.Config) (*zap.Logger, error) {
	if cfg.Logger.ZapPreset == config.DevelopmentLogger {
		return zap.NewDevelopment()
	}

	if cfg.Logger.ZapPreset == "production" {
		return zap.NewProduction()
	}

	return nil, errors.Errorf("unsupported logger: %v", cfg.Logger.ZapPreset)
}

func Register(builder *di.Builder) error {
	return builder.Add(di.Def{
		Name:  framework.Logger,
		Scope: di.App,
		Build: func(ctn di.Container) (interface{}, error) {
			return BuildLogger(ctn.Get(framework.Config).(config.Config))
		},
	})
}

func GetLogger(app di.Container) *zap.Logger {
	return app.Get(framework.Logger).(*zap.Logger)
}
