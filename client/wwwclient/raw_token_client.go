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

type RawTokenClient struct {
	*client.RawRestClient
	Cfg WwwClientConfig
}

func (clnt *RawTokenClient) baseURL() string {
	return clnt.Config.BaseURL + "/api/token"
}

func (clnt *RawTokenClient) CookieURL() (*url.URL, error) {
	if clnt.Cfg.CookieURL == "" {
		return nil, errors.New("cookie URL not set")
	}
	return url.Parse(clnt.Cfg.CookieURL)
}

func (clnt *RawTokenClient) CreateAuthCode(ctx context.Context, jar http.CookieJar, csrf string) (*resty.Response, error) {
	cookieURL, err := clnt.CookieURL()
	if err != nil {
		return nil, err
	}
	cookies := jar.Cookies(cookieURL)
	body := &viewmodel.WwwCSRFBody{
		CSRFToken: csrf,
	}
	return clnt.Request(ctx).
		SetCookies(cookies).
		SetBody(body).
		Post(clnt.baseURL() + "/auth-code")
}

func (clnt *RawTokenClient) Logout(ctx context.Context, jar http.CookieJar, csrf string) (*resty.Response, error) {
	cookieURL, err := clnt.CookieURL()
	if err != nil {
		return nil, err
	}
	cookies := jar.Cookies(cookieURL)
	body := &viewmodel.WwwCSRFBody{
		CSRFToken: csrf,
	}
	return clnt.Request(ctx).
		SetCookies(cookies).
		SetBody(body).
		Post(clnt.baseURL() + "/logout")
}
