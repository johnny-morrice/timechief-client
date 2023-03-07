package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
)

type RawCalendarClient struct {
	*client.RawRestClient
}

func (clnt *RawCalendarClient) GetCalendarForPrincipal(ctx context.Context, principalSerial string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("principalSerial", principalSerial).Get(clnt.Config.BaseURL + "/calendar/by-principal-serial/{principalSerial}")
}
