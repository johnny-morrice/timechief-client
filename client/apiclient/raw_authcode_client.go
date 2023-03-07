package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type RawAuthCodeClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawAuthCodeClient) CreateAuthCode(ctx context.Context, perms *viewmodel.TokenPermissions) (*resty.Response, error) {
	req := clnt.Credentials.SetAuthToken(clnt.Request(ctx))
	return req.SetBody(perms).Post(clnt.Config.BaseURL + "/auth-code")
}
