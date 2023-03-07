package apiclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type AuthCodeClient struct {
	RawClient *RawAuthCodeClient
}

func (clnt *AuthCodeClient) CreateAuthCode(ctx context.Context, perms *viewmodel.TokenPermissions) (*viewmodel.AuthCodeResponse, error) {
	resp, err := clnt.RawClient.CreateAuthCode(ctx, perms)
	if err != nil {
		return nil, err
	}
	clnt.RawClient.LogResty(resp)
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	authCode := &viewmodel.AuthCodeResponse{}
	err = client.DecodeResponse(authCode, "auth-code", resp)
	if err != nil {
		return nil, err
	}
	return authCode, nil
}
