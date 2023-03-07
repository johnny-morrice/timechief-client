package worldclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type LocaleClient struct {
	RawClient *RawLocaleClient
}

func (clnt *LocaleClient) List(ctx context.Context) (*viewmodel.LocaleList, error) {
	resp, err := clnt.RawClient.List(ctx)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	localeList := &viewmodel.LocaleList{}
	err = client.DecodeResponse(localeList, "locale-list", resp)
	if err != nil {
		return nil, err
	}
	return localeList, nil
}

func (clnt *LocaleClient) Search(ctx context.Context, term string) (*viewmodel.LocaleList, error) {
	resp, err := clnt.RawClient.Search(ctx, term)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	localeList := &viewmodel.LocaleList{}
	err = client.DecodeResponse(localeList, "locale-list", resp)
	if err != nil {
		return nil, err
	}
	return localeList, nil
}
