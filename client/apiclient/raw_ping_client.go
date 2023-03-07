package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawPingAPIClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawPingAPIClient) Ping(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Get(clnt.Config.BaseURL + "/ping")
}
