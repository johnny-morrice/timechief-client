package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
)

type RawWeatherClient struct {
	*client.RawRestClient
}

func (client *RawWeatherClient) OneCallByDeviceSerial(ctx context.Context, deviceSerial string) (*resty.Response, error) {
	return client.GetResource(ctx, "weather/one-call/by-device-serial", deviceSerial)
}
