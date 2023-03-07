package coreclient

import (
	"context"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
	"github.com/pkg/errors"
)

type ClockClient struct {
	*client.RestClient
}

func (client *ClockClient) Create(ctx context.Context, resource *viewmodel.Clock) (*viewmodel.Clock, error) {
	output := &viewmodel.Clock{}
	err := client.CreateAndDecode(ctx, "clock", resource, output)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (client *ClockClient) GetByDeviceSerial(ctx context.Context, deviceSerial string) (*viewmodel.Clock, error) {
	output := &viewmodel.Clock{}
	err := client.GetAndDecode(ctx, "clock/by-device-serial", output, deviceSerial)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (client *ClockClient) SetDeviceCredentials(ctx context.Context, deviceSerial, deviceSecret string) error {
	rawClient := &RawClockClient{
		RawRestClient: client.RawRestClient,
	}
	resp, err := rawClient.SetDeviceCredentials(ctx, deviceSerial, deviceSecret)
	if err != nil {
		return err
	}
	if resp.StatusCode() == http.StatusOK {
		return nil
	}
	return errors.Errorf("unexpected status code: %v", resp.StatusCode())
}

func (client *ClockClient) ValidateDeviceCredentials(ctx context.Context, deviceSerial, deviceSecret string) (bool, error) {
	rawClient := &RawClockClient{
		RawRestClient: client.RawRestClient,
	}
	resp, err := rawClient.ValidateDeviceCredentials(ctx, deviceSerial, deviceSecret)
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

func (client *ClockClient) Update(ctx context.Context, resourceID string, resource *viewmodel.Clock) error {
	return client.UpdateAndVerify(ctx, "clock", resourceID, resource)
}

func (client *ClockClient) List(ctx context.Context, params ...client.QueryParam) (*viewmodel.ClockPage, error) {
	output := &viewmodel.ClockPage{}
	err := client.ListAndDecode(ctx, "clock", output, params...)
	if err != nil {
		return nil, err
	}
	return output, nil
}

func (c *ClockClient) ListByPrincipal(ctx context.Context, principalSerial string, params ...client.QueryParam) (*viewmodel.ClockPage, error) {
	output := &viewmodel.ClockPage{}
	params = append(params, client.QueryParam{Param: "principal-serial", Value: principalSerial})
	err := c.ListAndDecode(ctx, "clock/by-principal-serial", output, params...)
	if err != nil {
		return nil, err
	}
	return output, nil
}
