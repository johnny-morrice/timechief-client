package apiclient

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type RawClockPrincipalAPIClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawClockPrincipalAPIClient) ClockBaseURL() string {
	return fmt.Sprintf("%v/clock-principal/clock", clnt.Config.BaseURL)
}

func (clnt *RawClockPrincipalAPIClient) ClockURL() string {
	return fmt.Sprintf("%v/{clockSerial}", clnt.ClockBaseURL())
}

func (clnt *RawClockPrincipalAPIClient) AccountsURL() string {
	return fmt.Sprintf("%v/clock-principal/accounts", clnt.Config.BaseURL)
}

func (clnt *RawClockPrincipalAPIClient) GetAccounts(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Get(clnt.AccountsURL())
}

func (clnt *RawClockPrincipalAPIClient) GetClock(ctx context.Context, clockSerial string) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetPathParam("clockSerial", clockSerial).Get(clnt.ClockURL())
}

func (clnt *RawClockPrincipalAPIClient) ListClocks(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Get(clnt.ClockBaseURL())
}

func (clnt *RawClockPrincipalAPIClient) UpdateClock(ctx context.Context, clockSerial string, clock *viewmodel.Clock) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetBody(clock).SetPathParam("clockSerial", clockSerial).Put(clnt.ClockURL())
}
