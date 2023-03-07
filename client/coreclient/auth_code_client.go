package coreclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type AuthCodeClient struct {
	RawClient *RawAuthCodeClient
}

func (clnt *AuthCodeClient) SetAuthCodeData(ctx context.Context, data string) (*viewmodel.CacheKeyResponse, error) {
	resp, err := clnt.RawClient.SetAuthCodeData(ctx, data)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.CacheKeyResponse{}
	err = client.DecodeResponse(out, "cache-key-response", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (clnt *AuthCodeClient) GetAuthCodeData(ctx context.Context, authCode string) (*viewmodel.CacheDataMessage, error) {
	resp, err := clnt.RawClient.GetAuthCodeData(ctx, authCode)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.CacheDataMessage{}
	err = client.DecodeResponse(out, "cache-data-message", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (clnt *AuthCodeClient) DeleteAuthCode(ctx context.Context, authCode string) error {
	resp, err := clnt.RawClient.DeleteAuthCode(ctx, authCode)
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusNoContent {
		return client.BadStatusError(resp.StatusCode(), http.StatusNoContent)
	}
	return nil
}
