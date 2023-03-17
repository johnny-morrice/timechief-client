package publicclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type VersionClient struct {
	*client.RestClient
}

func (client *VersionClient) List(ctx context.Context, params ...client.QueryParam) (*viewmodel.VersionPage, error) {
	output := &viewmodel.VersionPage{}
	err := client.ListAndDecode(ctx, "version", output, params...)
	if err != nil {
		return nil, err
	}
	return output, nil
}
