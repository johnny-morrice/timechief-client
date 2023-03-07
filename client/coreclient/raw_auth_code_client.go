package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type RawAuthCodeClient struct {
	*client.RawRestClient
}

func (clnt *RawAuthCodeClient) baseURL() string {
	return clnt.Config.BaseURL + "/auth-code"
}

func (clnt *RawAuthCodeClient) SetAuthCodeData(ctx context.Context, data string) (*resty.Response, error) {
	body := &viewmodel.CacheDataMessage{
		CacheData: data,
	}
	return clnt.Request(ctx).SetBody(body).Post(clnt.baseURL())
}

func (clnt *RawAuthCodeClient) GetAuthCodeData(ctx context.Context, authCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("authCode", authCode).Get(clnt.baseURL() + "/{authCode}")
}

func (clnt *RawAuthCodeClient) DeleteAuthCode(ctx context.Context, authCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("authCode", authCode).Delete(clnt.baseURL() + "/{authCode}")
}
