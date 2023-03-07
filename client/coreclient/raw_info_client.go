package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
)

type RawInfoClient struct {
	Build *RawInfoBuildClient
}

type RawInfoBuildClient struct {
	*client.RawRestClient
}

func (client *RawInfoBuildClient) Get(ctx context.Context) (*resty.Response, error) {
	return client.Request(ctx).
		Get(client.Config.BaseURL + "/info/build")
}
