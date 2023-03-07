package apiclient

import (
	"context"

	"github.com/johnny-morrice/timechief-client/client"
	"github.com/johnny-morrice/timechief-client/viewmodel"
)

type PairingAPIClient struct {
	RawClient *RawPairingAPIClient
}

func (clnt *PairingAPIClient) CreatePairing(ctx context.Context) (*viewmodel.PairingCode, error) {
	resp, err := clnt.RawClient.CreatePairing(ctx)
	return client.HandleOKResponse(&viewmodel.PairingCode{}, "pairing", resp, err)
}

func (clnt *PairingAPIClient) GetPairing(ctx context.Context, pairingCode string) (*viewmodel.PairingStatus, error) {
	resp, err := clnt.RawClient.GetPairing(ctx, pairingCode)
	return client.HandleOKResponse(&viewmodel.PairingStatus{}, "pairing", resp, err)
}

func (clnt *PairingAPIClient) LinkPrincipal(ctx context.Context, pairingCode string) error {
	resp, err := clnt.RawClient.LinkPrincipal(ctx, pairingCode)
	return client.HandleNoContentResponse("pairing", resp, err)
}

func (clnt *PairingAPIClient) CompletePairing(ctx context.Context, pairingCode string) error {
	resp, err := clnt.RawClient.CompletePairing(ctx, pairingCode)
	return client.HandleNoContentResponse("pairing", resp, err)
}
