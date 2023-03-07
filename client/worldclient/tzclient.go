package worldclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type TzClient struct {
	RawClient *RawTzClient
}

func (clnt *TzClient) List(ctx context.Context) (*viewmodel.TzInfoList, error) {
	resp, err := clnt.RawClient.List(ctx)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	tzInfo := &viewmodel.TzInfoList{}
	err = client.DecodeResponse(tzInfo, "tz-info-list", resp)
	if err != nil {
		return nil, err
	}
	return tzInfo, nil
}

func (clnt *TzClient) Search(ctx context.Context, term string) (*viewmodel.TzInfoList, error) {
	resp, err := clnt.RawClient.Search(ctx, term)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	tzInfo := &viewmodel.TzInfoList{}
	err = client.DecodeResponse(tzInfo, "tz-info-list", resp)
	if err != nil {
		return nil, err
	}
	return tzInfo, nil
}
