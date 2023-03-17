package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type VersionClient struct {
	*client.RestClient
}

func (clnt *VersionClient) Create(ctx context.Context, version *viewmodel.Version) (*resty.Response, error) {
	return clnt.CreateResource(ctx, "version", version)
}
