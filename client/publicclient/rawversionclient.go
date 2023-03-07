package publicclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
)

type RawVersionClient struct {
	*client.RawRestClient
}

func (client *RawVersionClient) List(ctx context.Context, params ...client.QueryParam) (*resty.Response, error) {
	return client.ListResource(ctx, "version", params...)
}
