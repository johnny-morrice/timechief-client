package wwwclient

import (
	"context"
	"errors"
	"net/http"
	"net/url"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type RawGoogleOAuthClient struct {
	*client.RawRestClient
	Cfg WwwClientConfig
}

func (clnt *RawGoogleOAuthClient) baseURL() string {
	return clnt.Config.BaseURL + "/api/google-oauth"
}

// TODO deduplicate.
func (clnt *RawGoogleOAuthClient) CookieURL() (*url.URL, error) {
	if clnt.Cfg.CookieURL == "" {
		return nil, errors.New("cookie URL not set")
	}
	return url.Parse(clnt.Cfg.CookieURL)
}

func (clnt *RawGoogleOAuthClient) AuthURL(ctx context.Context, jar http.CookieJar, csrf string) (*resty.Response, error) {
	cookieURL, err := clnt.CookieURL()
	if err != nil {
		return nil, err
	}
	body := &viewmodel.WwwCSRFBody{
		CSRFToken: csrf,
	}
	cookies := jar.Cookies(cookieURL)
	return clnt.Request(ctx).
		SetCookies(cookies).
		SetBody(body).
		Post(clnt.baseURL() + "/url")
}
