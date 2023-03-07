package apiclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type ClockDataAPIClient struct {
	RawClient *RawClockDataAPIClient
}

func (clnt *ClockDataAPIClient) GetClockData(ctx context.Context) (*viewmodel.ClockData, error) {
	resp, err := clnt.RawClient.GetClockData(ctx)
	if err != nil {
		return nil, err
	}
	output := &viewmodel.ClockData{}
	err = client.DecodeResponse(output, "clockdata", resp)
	if err != nil {
		return nil, err
	}
	return output, nil
}
