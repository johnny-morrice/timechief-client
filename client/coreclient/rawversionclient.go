package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type RawVersionClient struct {
	*client.RawRestClient
}

func (client *RawVersionClient) Create(ctx context.Context, version *viewmodel.Version) (*resty.Response, error) {
	return client.CreateResource(ctx, "version", version)
}
