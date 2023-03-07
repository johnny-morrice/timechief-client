package apiclient

import (
	"context"

	"github.com/go-resty/resty/v2"
	"github.com/johnny-morrice/timechief-client/client/client"
)

type RawPairingAPIClient struct {
	Credentials *APICredentials
	*client.RawRestClient
}

func (clnt *RawPairingAPIClient) baseURL() string {
	return clnt.Config.BaseURL + "/pairing"
}

func (clnt *RawPairingAPIClient) CreatePairing(ctx context.Context) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).Post(clnt.baseURL())
}

func (clnt *RawPairingAPIClient) GetPairing(ctx context.Context, pairingCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetPathParam("pairingCode", pairingCode).Get(clnt.baseURL() + "/{pairingCode}")
}

func (clnt *RawPairingAPIClient) LinkPrincipal(ctx context.Context, pairingCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetPathParam("pairingCode", pairingCode).Put(clnt.baseURL() + "/{pairingCode}")
}

func (clnt *RawPairingAPIClient) CompletePairing(ctx context.Context, pairingCode string) (*resty.Response, error) {
	return clnt.Request(ctx).SetAuthToken(clnt.Credentials.GetAuthToken()).SetPathParam("pairingCode", pairingCode).Post(clnt.baseURL() + "/{pairingCode}")
}
