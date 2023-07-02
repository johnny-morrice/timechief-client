package cmd

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound"
	"github.com/urfave/cli/v2"
)

func Sound(ctx *cli.Context) error {
	daemon := sound.Daemon{
		ListenAddr:       ctx.String("listen-addr"),
		PlayStartupSound: ctx.Bool("startup-sound"),
		PWMPin:           ctx.Int("pwm-pin"),
		Duty:             ctx.Int("duty"),
	}
	return daemon.Run(ctx.Context)
}
