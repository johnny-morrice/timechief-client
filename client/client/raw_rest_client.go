package client

import (
	"context"
	"fmt"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/protocol"
	"go.uber.org/zap"
)

type RestyOptionFunc func(*resty.Request) *resty.Request

type RawRestClient struct {
	Options []RestyOptionFunc
	Logger  *zap.Logger
	Config  ClientConfig
	resty   *resty.Client
}

func (client *RawRestClient) UpdateURL() string {
	return fmt.Sprintf("%v/{resourceName}/{resourceID}", client.Config.BaseURL)
}

func (client *RawRestClient) GetURL() string {
	return fmt.Sprintf("%v/{resourceName}/{resourceID}", client.Config.BaseURL)
}

func (client *RawRestClient) ListURL() string {
	return fmt.Sprintf("%v/{resourceName}", client.Config.BaseURL)
}

func (client *RawRestClient) UpdateResource(ctx context.Context, resourceName string, resourceID string, resource interface{}) (*resty.Response, error) {
	return client.Request(ctx).
		SetHeader(protocol.CONTENT_TYPE_HEADER, protocol.MIME_APPLICATION_JSON).
		SetBody(resource).
		SetPathParam("resourceName", resourceName).
		SetPathParam("resourceID", resourceID).
		Put(client.UpdateURL())
}

func (client *RawRestClient) CreateResource(ctx context.Context, resourceName string, resource interface{}) (*resty.Response, error) {
	return client.Request(ctx).
		SetBody(resource).
		SetHeader(protocol.CONTENT_TYPE_HEADER, protocol.MIME_APPLICATION_JSON).
		SetPathParam("resourceName", resourceName).
		Post(client.Config.BaseURL + "/{resourceName}")
}

func (client *RawRestClient) Resty() *resty.Client {
	if client.resty == nil {
		client.resty = resty.New().
			SetTimeout(client.Config.HTTPTimeout).
			SetRetryMaxWaitTime(client.Config.RetryMaxWaitTime)
	}
	return client.resty
}

func (client *RawRestClient) GetResource(ctx context.Context, resourceName string, resourceID string, parameters ...QueryParam) (*resty.Response, error) {
	return client.Request(ctx, parameters...).
		SetPathParam("resourceName", resourceName).
		SetPathParam("resourceID", resourceID).
		Get(client.GetURL())
}

type QueryParam struct {
	Param string
	Value interface{}
}

func (client *RawRestClient) ListResource(ctx context.Context, resourceName string, parameters ...QueryParam) (*resty.Response, error) {
	return client.Request(ctx, parameters...).
		SetPathParam("resourceName", resourceName).
		Get(client.ListURL())
}

func (client *RawRestClient) Request(ctx context.Context, parameters ...QueryParam) *resty.Request {
	request := client.Resty().
		SetRedirectPolicy(resty.NoRedirectPolicy()).
		R().
		SetContext(ctx).
		SetHeader(protocol.ACCEPT_HEADER, protocol.MIME_APPLICATION_JSON).
		SetHeader(protocol.FISH_TAG_HEADER, protocol.NewFishTag())
	request = client.ApplyOptions(request)
	for _, param := range parameters {
		request.SetQueryParam(param.Param, fmt.Sprint(param.Value))
	}
	return request
}

func (client *RawRestClient) ApplyOptions(request *resty.Request) *resty.Request {
	for _, opt := range client.Options {
		request = opt(request)
	}
	return request
}

func (client *RawRestClient) LogResty(resp *resty.Response) {
	if client.Config.DumpHTTP {
		fields := []zap.Field{}
		requestDump, err := DumpRequest(resp)
		if err != nil {
			client.Logger.Error("error dumping http request", zap.Error(err))
		} else {
			fields = append(fields, zap.String("weatherclock.core.client.http.request", requestDump))
		}
		responseDump, err := DumpResponse(resp)
		if err != nil {
			client.Logger.Error("error dumping http response", zap.Error(err))
		} else {
			fields = append(fields, zap.String("weatherclock.core.client.http.response", responseDump))
		}
		client.Logger.Debug("http dump", fields...)
	}
}
