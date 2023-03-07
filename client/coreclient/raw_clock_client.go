package coreclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type RawClockClient struct {
	*client.RawRestClient
}

func (client *RawClockClient) Create(ctx context.Context, clock *viewmodel.Clock) (*resty.Response, error) {
	return client.CreateResource(ctx, "clock", clock)
}

func (client *RawClockClient) GetByDeviceSerial(ctx context.Context, deviceSerial string) (*resty.Response, error) {
	return client.GetResource(ctx, "clock/by-device-serial", deviceSerial)
}

func (client *RawClockClient) ValidateDeviceCredentials(ctx context.Context, deviceSerial, deviceSecret string) (*resty.Response, error) {
	credentialsBody := &viewmodel.ClockCredentials{DeviceSerial: deviceSerial, DeviceSecret: deviceSecret}
	return client.Request(ctx).
		SetBody(credentialsBody).
		Post(fmt.Sprintf("%v/clock/credentials/validation", client.Config.BaseURL))
}

func (client *RawClockClient) SetDeviceCredentials(ctx context.Context, deviceSerial, deviceSecret string) (*resty.Response, error) {
	credentialsBody := &viewmodel.ClockCredentials{DeviceSerial: deviceSerial, DeviceSecret: deviceSecret}
	return client.Request(ctx).
		SetBody(credentialsBody).
		Post(fmt.Sprintf("%v/clock/credentials", client.Config.BaseURL))
}

func (client *RawClockClient) Update(ctx context.Context, clockID string, clock *viewmodel.Clock) (*resty.Response, error) {
	return client.UpdateResource(ctx, "clock", clockID, clock)
}

func (client *RawClockClient) List(ctx context.Context, params ...client.QueryParam) (*resty.Response, error) {
	return client.ListResource(ctx, "clock", params...)
}

func (c *RawClockClient) ListByPrincipal(ctx context.Context, principalSerial string, params ...client.QueryParam) (*resty.Response, error) {
	params = append(params, client.QueryParam{Param: "principal-serial", Value: principalSerial})
	return c.ListResource(ctx, "clock/by-principal-serial", params...)
}
