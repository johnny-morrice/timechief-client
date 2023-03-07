package apiclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type WorldGeocodeClient struct {
	RawClient *RawWorldGeocodeClient
}

func (clnt *WorldGeocodeClient) Geocode(ctx context.Context, req *GeocodeRequest) (*viewmodel.TzInfo, error) {
	resp, err := clnt.RawClient.Geocode(ctx, req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	tzInfo := &viewmodel.TzInfo{}
	err = client.DecodeResponse(tzInfo, "tz-info", resp)
	if err != nil {
		return nil, err
	}
	return tzInfo, nil
}
