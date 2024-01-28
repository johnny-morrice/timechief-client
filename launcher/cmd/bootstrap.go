package cmd

import (
	"github.com/johnny-morrice/timechief-client/launcher/bootstrap"
	"github.com/urfave/cli/v2"
)

func Bootstrap(ctx *cli.Context) error {
	timeout := ctx.Duration("timeout")
	opts := bootstrap.Options{
		Timeout: timeout,
	}
	return bootstrap.ConsoleBootstrap(opts)
}
