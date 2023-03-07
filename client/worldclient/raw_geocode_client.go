package worldclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/shopspring/decimal"
)

type RawGeocodeClient struct {
	*client.RawRestClient
}

type GeocodeLocation struct {
	Lat decimal.Decimal
	Lng decimal.Decimal
}

type GeocodeRequest struct {
	Location   *GeocodeLocation
	SearchTerm string
}

func (clnt *RawGeocodeClient) Geocode(ctx context.Context, req *GeocodeRequest) (*resty.Response, error) {
	wwwReq := clnt.Request(ctx)
	if req.Location != nil {
		wwwReq = wwwReq.SetQueryParam("lat", req.Location.Lat.String())
		wwwReq = wwwReq.SetQueryParam("lng", req.Location.Lng.String())
	} else {
		wwwReq = wwwReq.SetQueryParam("term", req.SearchTerm)
	}
	return wwwReq.Get(fmt.Sprintf("%v/geocode", clnt.Config.BaseURL))
}
