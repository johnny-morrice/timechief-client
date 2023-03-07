package wwwclient

import (
	"context"
	"errors"
	"net/http"
	"net/url"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type RawAuthClient struct {
	*client.RawRestClient
	Cfg WwwClientConfig
}

func (clnt *RawAuthClient) baseURL() string {
	return clnt.Config.BaseURL + "/auth"
}

func (clnt *RawAuthClient) CookieURL() (*url.URL, error) {
	if clnt.Cfg.CookieURL == "" {
		return nil, errors.New("cookie URL not set")
	}
	return url.Parse(clnt.Cfg.CookieURL)
}

func (clnt *RawAuthClient) Login(ctx context.Context, jar http.CookieJar, creds *viewmodel.PrincipalCredentials) (*resty.Response, error) {
	cookieURL, err := clnt.CookieURL()
	if err != nil {
		return nil, err
	}
	resp, err := clnt.Request(ctx).SetBody(creds).Post(clnt.baseURL() + "/login")
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() == http.StatusOK {
		jar.SetCookies(cookieURL, resp.Cookies())
	}
	return resp, err
}
