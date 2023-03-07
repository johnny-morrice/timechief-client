package wwwclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client/client"
)

type GoogleExternalClient struct {
	RawClient *RawGoogleExternalClient
}

func (clnt *GoogleExternalClient) Callback(ctx context.Context, jar http.CookieJar, authCode, state string) (*client.RedirectCapture, error) {
	resp, err := clnt.RawClient.Callback(ctx, jar, authCode, state)
	return client.HandleRedirectCapture("oauth2-callback", resp, err)
}
