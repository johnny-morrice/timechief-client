package coreclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type RawPairingClient struct {
	*client.RawRestClient
}

func (clnt *RawPairingClient) baseURL() string {
	return clnt.Config.BaseURL + "/pairing"
}

func (clnt *RawPairingClient) CreatePairing(ctx context.Context, deviceSerial string) (*resty.Response, error) {
	return clnt.Request(ctx).SetBody(&viewmodel.CreatePairingRequest{DeviceSerial: deviceSerial}).Post(clnt.baseURL())
}

func (clnt *RawPairingClient) GetPairing(ctx context.Context, pairingCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("pairingCode", pairingCode).Get(clnt.baseURL() + "/{pairingCode}")
}

func (clnt *RawPairingClient) LinkPrincipal(ctx context.Context, pairingCode, principalSerial string) (*resty.Response, error) {
	body := &viewmodel.LinkPrincipalPairingRequest{
		PrincipalSerial: principalSerial,
		PairingCode:     pairingCode,
	}
	return clnt.Request(ctx).SetBody(body).Put(clnt.baseURL())
}

func (clnt *RawPairingClient) CompletePairing(ctx context.Context, pairingCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetPathParam("pairingCode", pairingCode).Post(clnt.baseURL() + "/{pairingCode}")
}
