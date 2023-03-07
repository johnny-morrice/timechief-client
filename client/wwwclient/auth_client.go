package wwwclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type AuthClient struct {
	RawClient *RawAuthClient
}

func (clnt *AuthClient) Login(ctx context.Context, jar http.CookieJar, creds *viewmodel.PrincipalCredentials) (*viewmodel.WwwLoginResponse, error) {
	resp, err := clnt.RawClient.Login(ctx, jar, creds)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.WwwLoginResponse{}
	err = client.DecodeResponse(out, "login-response", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}
