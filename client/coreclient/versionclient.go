package coreclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type VersionClient struct {
	*client.RestClient
}

func (clnt *VersionClient) Create(ctx context.Context, resource *viewmodel.Version) (*viewmodel.Version, error) {
	output := &viewmodel.Version{}
	err := clnt.CreateAndDecode(ctx, "version", resource, output)
	if err != nil {
		return nil, err
	}
	return output, nil
}
