package coreclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type SessionClient struct {
	RawClient *RawSessionClient
}

func (clnt *SessionClient) CreateSession(ctx context.Context, args *viewmodel.MakeSessionParameters) (*viewmodel.SessionData, error) {
	resp, err := clnt.RawClient.CreateSession(ctx, args)
	return client.HandleOKResponse(&viewmodel.SessionData{}, "session", resp, err)
}

func (clnt *SessionClient) ValidateSession(ctx context.Context, sessionID string) error {
	resp, err := clnt.RawClient.ValidateSession(ctx, sessionID)
	return client.HandleNoContentResponse("session", resp, err)
}

func (clnt *SessionClient) ValidateCSRFToken(ctx context.Context, sessionID, csrfToken string) error {
	resp, err := clnt.RawClient.ValidateCSRFToken(ctx, sessionID, csrfToken)
	return client.HandleNoContentResponse("session", resp, err)
}

func (clnt *SessionClient) RemoveSession(ctx context.Context, sessionID string) error {
	resp, err := clnt.RawClient.RemoveSession(ctx, sessionID)
	return client.HandleNoContentResponse("session", resp, err)
}
