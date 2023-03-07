package apiclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client"
)

type PingAPIClient struct {
	RawClient *RawPingAPIClient
}

func (clnt *PingAPIClient) Ping(ctx context.Context) error {
	resp, err := clnt.RawClient.Ping(ctx)
	return client.HandleNoContentResponse("ping", resp, err)
}
