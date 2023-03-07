package coreclient

import (
	"context"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type WeatherClient struct {
	*client.RestClient
}

func (client *WeatherClient) OneCallByDeviceSerial(ctx context.Context, deviceSerial string) (*viewmodel.OneCallWeather, error) {
	weather := &viewmodel.OneCallWeather{}
	err := client.GetAndDecode(ctx, "weather/one-call/by-device-serial", weather, deviceSerial)
	if err != nil {
		return nil, err
	}
	return weather, nil
}
