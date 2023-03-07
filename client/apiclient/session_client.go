package apiclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client"
)

type SessionAPIClient struct {
	RawClient *RawSessionAPIClient
}

func (clnt *SessionAPIClient) RemoveSession(ctx context.Context) error {
	resp, err := clnt.RawClient.RemoveSession(ctx)
	return client.HandleNoContentResponse("session", resp, err)
}
