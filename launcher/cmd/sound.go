package cmd

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound"
	"github.com/urfave/cli/v2"
)

func Sound(ctx *cli.Context) error {
	cfg := sound.Config{
		ListenAddr:       ctx.String("listen-addr"),
		SoundProvider:    ctx.String("sound-provider"),
		PlayStartupSound: ctx.Bool("startup-sound"),
		PassiveBuzzer: sound.PassiveBuzzerConfig{
			PWMPin: ctx.Int("pwm-pin"),
			Duty:   ctx.Int("duty"),
		},
		Pipewire: sound.PipewireConfig{
			Volume: ctx.Float64("volume"),
		},
	}
	daemon, err := sound.MakeDaemon(cfg)
	if err != nil {
		return err
	}
	return daemon.Run(ctx.Context)
}
