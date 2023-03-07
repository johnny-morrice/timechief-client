package worldclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type GeocodeClient struct {
	RawClient *RawGeocodeClient
}

func (clnt *GeocodeClient) Geocode(ctx context.Context, req *GeocodeRequest) (*viewmodel.GeocodeResult, error) {
	resp, err := clnt.RawClient.Geocode(ctx, req)

	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	geocodeResp := &viewmodel.GeocodeResult{}
	err = client.DecodeResponse(geocodeResp, "geocode-result", resp)
	if err != nil {
		return nil, err
	}
	return geocodeResp, nil
}
