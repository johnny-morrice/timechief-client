package coreclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
)

type RawClockPrincipalClient struct {
	*client.RawRestClient
}

func (client *RawClockPrincipalClient) AddClock(ctx context.Context, principalSerial, clockSerial string) (*resty.Response, error) {
	return client.Request(ctx).SetPathParam("principalSerial", principalSerial).SetPathParam("clockSerial", clockSerial).Patch(client.clockURL())
}

func (client *RawClockPrincipalClient) RemoveClock(ctx context.Context, principalSerial, clockSerial string) (*resty.Response, error) {
	return client.Request(ctx).SetPathParam("principalSerial", principalSerial).SetPathParam("clockSerial", clockSerial).Delete(client.clockURL())
}

func (client *RawClockPrincipalClient) UpdateClockForPrincipal(ctx context.Context, principalSerial, clockSerial string, clock *viewmodel.Clock) (*resty.Response, error) {
	return client.Request(ctx).
		SetPathParam("principalSerial", principalSerial).
		SetPathParam("clockSerial", clockSerial).
		SetBody(clock).
		Put(client.clockURL())
}

func (client *RawClockPrincipalClient) GetClockForPrincipal(ctx context.Context, principalSerial, clockSerial string) (*resty.Response, error) {
	return client.Request(ctx).SetPathParam("principalSerial", principalSerial).SetPathParam("clockSerial", clockSerial).Get(client.clockURL())
}

func (client *RawClockPrincipalClient) clockURL() string {
	return fmt.Sprintf("%s/clock-principal/clock/{principalSerial}/{clockSerial}", client.Config.BaseURL)
}

func (client *RawClockPrincipalClient) Create(ctx context.Context, clock *viewmodel.ClockPrincipal) (*resty.Response, error) {
	return client.CreateResource(ctx, "clock-principal", clock)
}

func (client *RawClockPrincipalClient) GetByPrincipalSerial(ctx context.Context, principalSerial string) (*resty.Response, error) {
	return client.GetResource(ctx, "clock-principal/by-principal-serial", principalSerial)
}

func (client *RawClockPrincipalClient) ValidatePrincipalCredentials(ctx context.Context, principalSerial, deviceSecret string) (*resty.Response, error) {
	credentialsBody := &viewmodel.PrincipalCredentials{PrincipalSerial: principalSerial, PrincipalSecret: deviceSecret}
	return client.Request(ctx).
		SetBody(credentialsBody).
		Post(fmt.Sprintf("%v/clock-principal/credentials/validation", client.Config.BaseURL))
}

func (client *RawClockPrincipalClient) SetPrincipalCredentials(ctx context.Context, serial, secret string) (*resty.Response, error) {
	credentialsBody := &viewmodel.PrincipalCredentials{PrincipalSerial: serial, PrincipalSecret: secret}
	return client.Request(ctx).
		SetBody(credentialsBody).
		Post(fmt.Sprintf("%v/clock-principal/credentials", client.Config.BaseURL))
}

func (client *RawClockPrincipalClient) Update(ctx context.Context, serial string, principal *viewmodel.ClockPrincipal) (*resty.Response, error) {
	return client.UpdateResource(ctx, "clock-principal", serial, principal)
}

func (client *RawClockPrincipalClient) List(ctx context.Context, params ...client.QueryParam) (*resty.Response, error) {
	return client.ListResource(ctx, "clock-principal", params...)
}
