package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawClockDataAPIClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawClockDataAPIClient) GetClockData(ctx context.Context) (*resty.Response, error) {
	req := clnt.Credentials.SetAuthToken(clnt.Request(ctx))
	return req.Get(clnt.Config.BaseURL + "/clockdata")
}
