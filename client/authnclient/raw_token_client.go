package authnclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type RawTokenClient struct {
	*client.RawRestClient
}

func (clnt *RawTokenClient) CreateToken(ctx context.Context, tokenRequest *viewmodel.TokenRequest) (*resty.Response, error) {
	return clnt.CreateResource(ctx, "token", tokenRequest)
}
