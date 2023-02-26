package main

import "github.com/urfave/cli/v2"

func main() {

}

// getCLIApp returns a new cli.App instance with two modes, one for launching the timechief client, and the other for running a daemon that downloads updates.
func getCLIApp() *cli.App {
	app := cli.NewApp()
	app.Name = "timechief"
	app.Usage = "Launcher for timechief smartclock"
	app.Version = "0.0.1"
	app.Commands = []*cli.Command{
		{
			Name:    "client",
			Aliases: []string{"c"},
			Usage:   "Launch the timechief client",
			Action:  launchClient,
		},
		{
			Name:    "daemon",
			Aliases: []string{"d"},
			Usage:   "Run the update daemon",
			Action:  launchDaemon,
		},
	}
	return app
}

func launchClient(c *cli.Context) error {
	return nil
}

func launchDaemon(c *cli.Context) error {
	return nil
}
