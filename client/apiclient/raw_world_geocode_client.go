package apiclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/shopspring/decimal"
)

type RawWorldGeocodeClient struct {
	Credentials *APICredentials
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

func (clnt *RawWorldGeocodeClient) Geocode(ctx context.Context, req *GeocodeRequest) (*resty.Response, error) {
	wwwReq := clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken())
	if req.Location != nil {
		wwwReq = wwwReq.SetQueryParam("lat", req.Location.Lat.String())
		wwwReq = wwwReq.SetQueryParam("lng", req.Location.Lng.String())
	} else {
		wwwReq = wwwReq.SetQueryParam("term", req.SearchTerm)
	}
	return wwwReq.Get(fmt.Sprintf("%v/world/geocode", clnt.Config.BaseURL))
}
