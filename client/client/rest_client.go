package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-resty/resty/v2"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

type RestClient struct {
	*RawRestClient
	Logger *zap.Logger
}

func (client *RestClient) UpdateAndVerify(ctx context.Context, resourceName string, resourceID string, resource interface{}) error {
	resp, err := client.UpdateResource(ctx, resourceName, resourceID, resource)
	if err != nil {
		return errors.Wrapf(err, "failed to get: %v", resourceName)
	}
	client.LogResty(resp)
	if resp.StatusCode() != http.StatusNoContent {
		return BadStatusError(resp.StatusCode(), http.StatusNoContent)
	}
	return nil
}

func (client *RestClient) GetAndDecode(ctx context.Context, resourceName string, output interface{}, resourceID string, parameters ...QueryParam) error {
	resp, err := client.GetResource(ctx, resourceName, resourceID, parameters...)
	if err != nil {
		return errors.Wrapf(err, "failed to get %v", resourceName)
	}
	client.LogResty(resp)
	if resp.StatusCode() != http.StatusOK {
		return BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	return DecodeResponse(output, resourceName, resp)
}

func (client *RestClient) ListAndDecode(ctx context.Context, resourceName string, output interface{}, parameters ...QueryParam) error {
	resp, err := client.ListResource(ctx, resourceName, parameters...)
	if err != nil {
		return errors.Wrapf(err, "failed to list %v", resourceName)
	}
	client.LogResty(resp)
	if resp.StatusCode() != http.StatusOK {
		return BadStatusError(resp.StatusCode(), http.StatusOK, http.StatusNoContent)
	}
	return DecodeResponse(output, resourceName, resp)
}

func (client *RestClient) CreateAndDecode(ctx context.Context, resourceName string, input interface{}, output interface{}) error {
	resp, err := client.CreateResource(ctx, resourceName, input)
	if err != nil {
		return err
	}
	client.LogResty(resp)

	if resp.StatusCode() != http.StatusOK {
		return BadStatusError(resp.StatusCode(), http.StatusOK)
	}

	return DecodeResponse(output, resourceName, resp)
}

func BadStatusError(actualStatus int, expectedStatus int, additionalExpectedStatus ...int) error {
	expected := append(additionalExpectedStatus, expectedStatus)
	return fmt.Errorf("expected status %v but received %v", expected, actualStatus)
}

func DecodeResponse(output interface{}, resourceName string, resp *resty.Response) error {
	err := json.NewDecoder(bytes.NewBuffer(resp.Body())).Decode(output)
	if err != nil {
		return errors.Wrapf(err, "failed to decode %v", resourceName)
	}
	return nil
}

type RedirectCapture struct {
	Location string
}

func HandleRedirectCapture(resourceName string, resp *resty.Response, restyError error) (*RedirectCapture, error) {
	if restyError != nil {
		return nil, errors.Wrapf(restyError, "error on %s request", resourceName)
	}

	if resp.StatusCode() != http.StatusFound {
		return nil, BadStatusError(resp.StatusCode(), http.StatusFound)
	}

	location := resp.Header().Get("Location")
	if location == "" {
		return nil, fmt.Errorf("expected redirect location for resource: %s", resourceName)
	}
	return &RedirectCapture{Location: location}, nil
}

func HandleOKResponse[T any](output T, resourceName string, resp *resty.Response, restyError error) (T, error) {
	var nope T
	if restyError != nil {
		return nope, errors.Wrapf(restyError, "error on %s request", resourceName)
	}
	if resp.StatusCode() != http.StatusOK {
		return nope, BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	err := DecodeResponse(output, resourceName, resp)
	if err != nil {
		return nope, err
	}
	return output, nil
}

func HandleNoContentResponse(resourceName string, resp *resty.Response, restyError error) error {
	if restyError != nil {
		return errors.Wrapf(restyError, "error on %s request", resourceName)
	}
	if resp.StatusCode() != http.StatusNoContent {
		return BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	return nil
}
