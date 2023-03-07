package coreclient

import (
	"context"
	"fmt"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
	"github.com/pkg/errors"
)

type ClockPrincipalClient struct {
	*client.RestClient
}

func (client *ClockPrincipalClient) AddClock(ctx context.Context, principalSerial, clockSerial string) error {
	resp, err := client.rawClient().AddClock(ctx, principalSerial, clockSerial)
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusNoContent {
		return fmt.Errorf("expected status %v but received %v", http.StatusNoContent, resp.StatusCode())
	}
	return nil
}

func (client *ClockPrincipalClient) RemoveClock(ctx context.Context, principalSerial, clockSerial string) error {
	resp, err := client.rawClient().RemoveClock(ctx, principalSerial, clockSerial)
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusNoContent {
		return fmt.Errorf("expected status %v but received %v", http.StatusNoContent, resp.StatusCode())
	}
	return nil
}

func (c *ClockPrincipalClient) UpdateClockForPrincipal(ctx context.Context, principalSerial, clockSerial string, clock *viewmodel.Clock) error {
	rawClient := &RawClockPrincipalClient{
		RawRestClient: c.RawRestClient,
	}
	resp, err := rawClient.UpdateClockForPrincipal(ctx, principalSerial, clockSerial, clock)
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusNoContent {
		return client.BadStatusError(resp.StatusCode(), http.StatusNoContent)
	}
	return nil
}

func (c *ClockPrincipalClient) GetClockForPrincipal(ctx context.Context, principalSerial, clockSerial string) (*viewmodel.Clock, error) {
	resp, err := c.rawClient().GetClockForPrincipal(ctx, principalSerial, clockSerial)
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

func (client *ClockPrincipalClient) rawClient() *RawClockPrincipalClient {
	return &RawClockPrincipalClient{
		RawRestClient: client.RawRestClient,
	}
}

func (client *ClockPrincipalClient) Create(ctx context.Context, resource *viewmodel.ClockPrincipal) (*viewmodel.ClockPrincipal, error) {
	output := &viewmodel.ClockPrincipal{}
	err := client.CreateAndDecode(ctx, "clock-principal", resource, output)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (client *ClockPrincipalClient) GetByPrincipalSerial(ctx context.Context, serial string) (*viewmodel.ClockPrincipal, error) {
	output := &viewmodel.ClockPrincipal{}
	err := client.GetAndDecode(ctx, "clock-principal/by-principal-serial", output, serial)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (client *ClockPrincipalClient) SetPrincipalCredentials(ctx context.Context, serial, secret string) error {
	rawClient := &RawClockPrincipalClient{
		RawRestClient: client.RawRestClient,
	}
	resp, err := rawClient.SetPrincipalCredentials(ctx, serial, secret)
	if err != nil {
		return err
	}
	if resp.StatusCode() == http.StatusOK {
		return nil
	}
	return errors.Errorf("unexpected status code: %v", resp.StatusCode())
}

func (client *ClockPrincipalClient) ValidatePrincipalCredentials(ctx context.Context, serial, secret string) (bool, error) {
	rawClient := &RawClockPrincipalClient{
		RawRestClient: client.RawRestClient,
	}
	resp, err := rawClient.ValidatePrincipalCredentials(ctx, serial, secret)
	if err != nil {
		return false, err
	}
	if resp.StatusCode() == http.StatusOK {
		return true, nil
	} else if resp.StatusCode() == http.StatusUnauthorized {
		return false, nil
	}
	return false, errors.Errorf("unexpected status code: %v", resp.StatusCode())
}

func (client *ClockPrincipalClient) Update(ctx context.Context, serial string, resource *viewmodel.ClockPrincipal) error {
	return client.UpdateAndVerify(ctx, "clock-principal", serial, resource)
}

func (client *ClockPrincipalClient) List(ctx context.Context, params ...client.QueryParam) (*viewmodel.ClockPrincipalPage, error) {
	output := &viewmodel.ClockPrincipalPage{}
	err := client.ListAndDecode(ctx, "clock-principal", output, params...)
	if err != nil {
		return nil, err
	}
	return output, nil
}
