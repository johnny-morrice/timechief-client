package cmd

import (
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/bootstrap"
	"github.com/urfave/cli/v2"
)

func Bootstrap(ctx *cli.Context) error {
	timeout := ctx.Duration("timeout")
	opts := bootstrap.Options{
		Timeout: timeout,
		FactoryResetCallback: func() error {
			log.Println("TODO implement factory reset")
			return nil
		},
	}
	return bootstrap.ConsoleBootstrap(opts)
}
