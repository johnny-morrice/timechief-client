package cmd

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"github.com/urfave/cli/v2"
)

func Reboot(ctx *cli.Context) error {
	baseURL := ctx.String("daemon-base-url")
	credentialsPath := ctx.String("credentials-path")
	dc, err := daemonclient.NewDaemonClient(baseURL, daemonclient.CredentialProvider{
		CredentialPath: credentialsPath,
	})
	if err != nil {
		return fmt.Errorf("error building daemon client: %w", err)
	}

	return dc.PostReboot()
}

func Shutdown(ctx *cli.Context) error {
	baseURL := ctx.String("daemon-base-url")
	credentialsPath := ctx.String("credentials-path")
	dc, err := daemonclient.NewDaemonClient(baseURL, daemonclient.CredentialProvider{
		CredentialPath: credentialsPath,
	})
	if err != nil {
		return fmt.Errorf("error building daemon client: %w", err)
	}

	return dc.PostShutdown()
}
