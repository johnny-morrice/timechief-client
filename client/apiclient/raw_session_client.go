package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
)

type RawSessionAPIClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawSessionAPIClient) RemoveSession(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Delete(clnt.Config.BaseURL + "/session")
}
