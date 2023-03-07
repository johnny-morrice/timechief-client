package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawWorldTzClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawWorldTzClient) baseURL() string {
	return clnt.Config.BaseURL + "/world/tz"
}

func (clnt *RawWorldTzClient) List(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Get(clnt.baseURL())
}

func (clnt *RawWorldTzClient) Search(ctx context.Context, term string) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetQueryParam("term", term).Get(clnt.baseURL() + "/search")
}
