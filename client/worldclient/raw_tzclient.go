package worldclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
)

type RawTzClient struct {
	*client.RawRestClient
}

func (clnt *RawTzClient) baseURL() string {
	return clnt.Config.BaseURL + "/tz"
}

func (clnt *RawTzClient) List(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).Get(clnt.baseURL())
}

func (clnt *RawTzClient) Search(ctx context.Context, term string) (*resty.Response, error) {
	return clnt.Request(ctx).SetQueryParam("term", term).Get(fmt.Sprintf("%v/search", clnt.baseURL()))
}
