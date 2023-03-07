package apiclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type ClockPrincipalAPIClient struct {
	RawClient *RawClockPrincipalAPIClient
}

func (clnt *ClockPrincipalAPIClient) GetClock(ctx context.Context, clockSerial string) (*viewmodel.Clock, error) {
	resp, err := clnt.RawClient.GetClock(ctx, clockSerial)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.Clock{}
	err = client.DecodeResponse(out, "clock", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (clnt *ClockPrincipalAPIClient) ListClocks(ctx context.Context) (*viewmodel.ClockPage, error) {
	resp, err := clnt.RawClient.ListClocks(ctx)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	out := &viewmodel.ClockPage{}
	err = client.DecodeResponse(out, "clock-page", resp)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (clnt *ClockPrincipalAPIClient) UpdateClock(ctx context.Context, clockSerial string, clock *viewmodel.Clock) error {
	resp, err := clnt.RawClient.UpdateClock(ctx, clockSerial, clock)
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusNoContent {
		return client.BadStatusError(resp.StatusCode(), http.StatusNoContent)
	}
	return nil
}
