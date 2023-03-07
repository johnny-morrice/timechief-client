package authnclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type TokenClient struct {
	*client.RestClient
}

func (clnt *TokenClient) CreateToken(ctx context.Context, tokenRequest *viewmodel.TokenRequest) (*viewmodel.TokenResponse, error) {
	token := &viewmodel.TokenResponse{}
	err := clnt.CreateAndDecode(ctx, "token", tokenRequest, token)
	if err != nil {
		return nil, err
	}
	return token, err
}
