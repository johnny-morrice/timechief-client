package main

import (
	"log"
	"os"

	"github.com/johnny-morrice/timechief-client/launcher/cmd"
	"github.com/johnny-morrice/timechief-client/launcher/cmd/target"
	"github.com/johnny-morrice/timechief-client/launcher/store"
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
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:  "install-root",
					Value: store.DefaultInstallRoot,
				},
				&cli.BoolFlag{
					Name:  "standalone",
					Value: true,
				},
				&cli.StringFlag{
					Name:  "daemon-base-url",
					Value: "http://localhost:8080",
				},
			},
		},
		{
			Name:    "daemon",
			Aliases: []string{"d"},
			Usage:   "Run the update daemon",
			Action:  cmd.Daemon,
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:  "install-root",
					Value: store.DefaultInstallRoot,
				},
				&cli.BoolFlag{
					Name:  "install-daemon",
					Value: defaultInstallDaemon,
				},
				&cli.StringFlag{
					Name:  "listen-addr",
					Value: "0.0.0.0:8080",
				},
			},
		},
		{
			Name: "initialise",
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:  "install-root",
					Value: store.DefaultInstallRoot,
				},
				&cli.StringFlag{
					Name:  "api-base-url",
					Value: store.DefaultBaseURL,
				},
				&cli.StringFlag{
					Name:  "product",
					Value: store.DefaultProduct,
				},
				&cli.StringFlag{
					Name:  "stream",
					Value: store.DefaultStream,
				},
				&cli.BoolFlag{
					Name:  "install-daemon",
					Value: defaultInstallDaemon,
				},
			},
			Usage:  "Initialise the database and download the latest version of the timechief client",
			Action: cmd.Initialise,
		},
		{
			Name: "update",
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:  "install-root",
					Value: store.DefaultInstallRoot,
				},
				&cli.StringFlag{
					Name:  "api-base-url",
					Value: store.DefaultBaseURL,
				},
				&cli.StringFlag{
					Name:  "product",
					Value: store.DefaultProduct,
				},
				&cli.StringFlag{
					Name:  "stream",
					Value: store.DefaultStream,
				},
				&cli.BoolFlag{
					Name:  "install-daemon",
					Value: defaultInstallDaemon,
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
					Flags: []cli.Flag{
						&cli.StringFlag{
							Name: "target-root",
						},
						&cli.StringFlag{
							Name: "log-file",
						},
					},
				},
				{
					Name:   "install",
					Action: target.Install,
					Flags: []cli.Flag{
						&cli.StringFlag{
							Name: "executable",
						},
						&cli.StringFlag{
							Name: "target-root",
						},
					},
				},
			},
		},
	}
	return app
}

const defaultInstallDaemon = false
