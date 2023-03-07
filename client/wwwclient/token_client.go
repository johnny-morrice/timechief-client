package wwwclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type TokenClient struct {
	RawClient *RawTokenClient
}

func (clnt *TokenClient) CreateAuthCode(ctx context.Context, jar http.CookieJar, csrf string) (*viewmodel.AuthCodeResponse, error) {
	resp, err := clnt.RawClient.CreateAuthCode(ctx, jar, csrf)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.AuthCodeResponse{}
	err = client.DecodeResponse(out, "auth-code", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (clnt *TokenClient) Logout(ctx context.Context, jar http.CookieJar, csrf string) error {
	resp, err := clnt.RawClient.CreateAuthCode(ctx, jar, csrf)
	return client.HandleNoContentResponse("www-logout", resp, err)
}
