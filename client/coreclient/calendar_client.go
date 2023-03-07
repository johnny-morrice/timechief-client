package coreclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type CalendarClient struct {
	RawClient *RawCalendarClient
}

func (clnt *CalendarClient) GetCalendarForPrincipal(ctx context.Context, principalSerial string) (*viewmodel.CalendarResponse, error) {
	resp, err := clnt.RawClient.GetCalendarForPrincipal(ctx, principalSerial)
	return client.HandleOKResponse(&viewmodel.CalendarResponse{}, "calendar", resp, err)
}
