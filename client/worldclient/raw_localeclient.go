package worldclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawLocaleClient struct {
	*client.RawRestClient
}

func (clnt *RawLocaleClient) baseURL() string {
	return clnt.Config.BaseURL + "/locale"
}

func (clnt *RawLocaleClient) List(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).Get(clnt.baseURL())
}

func (clnt *RawLocaleClient) Search(ctx context.Context, term string) (*resty.Response, error) {
	return clnt.Request(ctx).SetQueryParam("term", term).Get(fmt.Sprintf("%v/search", clnt.baseURL()))
}
