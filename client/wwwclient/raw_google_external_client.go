package wwwclient

import (
	"context"
	"errors"
	"net/http"
	"net/url"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawGoogleExternalClient struct {
	*client.RawRestClient
	Cfg WwwClientConfig
}

func (clnt *RawGoogleExternalClient) baseURL() string {
	return clnt.Config.BaseURL + "/external/google"
}

// TODO deduplicate.
func (clnt *RawGoogleExternalClient) CookieURL() (*url.URL, error) {
	if clnt.Cfg.CookieURL == "" {
		return nil, errors.New("cookie URL not set")
	}
	return url.Parse(clnt.Cfg.CookieURL)
}

func (clnt *RawGoogleExternalClient) Callback(ctx context.Context, jar http.CookieJar, authCode, state string) (*resty.Response, error) {
	cookieURL, err := clnt.CookieURL()
	if err != nil {
		return nil, err
	}
	cookies := jar.Cookies(cookieURL)
	return clnt.Request(ctx).
		SetCookies(cookies).
		SetQueryParam("code", authCode).
		SetQueryParam("state", state).
		Get(clnt.baseURL() + "/callback")
}
