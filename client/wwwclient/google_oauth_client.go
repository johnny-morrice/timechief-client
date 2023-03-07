package wwwclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type GoogleOAuthClient struct {
	RawClient *RawGoogleOAuthClient
}

func (clnt *GoogleOAuthClient) AuthURL(ctx context.Context, jar http.CookieJar, csrf string) (*viewmodel.GoogleAuthorizationURL, error) {
	resp, err := clnt.RawClient.AuthURL(ctx, jar, csrf)
	return client.HandleOKResponse(&viewmodel.GoogleAuthorizationURL{}, "google-auth-url", resp, err)
}
