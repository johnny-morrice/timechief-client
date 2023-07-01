package task

import "github.com/urfave/cli/v2"

func isSystemAutomationEnabled(ctx *cli.Context) bool {
	return ctx.Bool("system-automation")
}
