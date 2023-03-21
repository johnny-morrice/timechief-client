package main

import (
	"log"
	"os"

	"github.com/johnny-morrice/timechief-client/launcher/cmd"
	"github.com/johnny-morrice/timechief-client/launcher/cmd/target"
	"github.com/urfave/cli/v2"
)

func main() {
	app := getCLIApp()
	err := app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}
}

// getCLIApp returns a new cli.App instance with two modes, one for launching the timechief client, and the other for running a daemon that downloads updates.
func getCLIApp() *cli.App {
	app := cli.NewApp()
	app.Name = "timechief-launcher"
	app.Usage = "Launcher for timechief smartclock"
	app.Version = "0.0.1"
	app.Commands = []*cli.Command{
		{
			Name:    "run-client",
			Aliases: []string{"c"},
			Usage:   "Launch the timechief client",
			Action:  cmd.RunClient,
		},
		{
			Name:    "daemon",
			Aliases: []string{"d"},
			Usage:   "Run the update daemon",
			Action:  cmd.Daemon,
		},
		{
			Name: "initialise",
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name: "install-root",
				},
				&cli.StringFlag{
					Name: "api-base-url",
				},
				&cli.StringFlag{
					Name: "product",
				},
				&cli.StringFlag{
					Name: "stream",
				},
			},
			Usage:  "Initialise the database and download the latest version of the timechief client",
			Action: cmd.Initialise,
		},
		{
			Name: "update",
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name: "install-root",
				},
				&cli.StringFlag{
					Name: "api-base-url",
				},
				&cli.StringFlag{
					Name: "product",
				},
				&cli.StringFlag{
					Name: "stream",
				},
			},
			Usage:  "Update the database and download the latest version of the timechief client",
			Action: cmd.Update,
		},
		{
			Name: "target",
			Subcommands: []*cli.Command{
				{
					Name:   "run",
					Action: target.Run,
				},
				{
					Name:   "install",
					Action: target.Install,
				},
			},
		},
	}
	return app
}
