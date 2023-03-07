package coreclient

import (
	"context"

	"github.com/johnny-morrice/timechief/client"
	"github.com/johnny-morrice/timechief/model/viewmodel"
)

type PairingClient struct {
	RawClient *RawPairingClient
}

func (clnt *PairingClient) CreatePairing(ctx context.Context, deviceSerial string) (*viewmodel.PairingCode, error) {
	resp, err := clnt.RawClient.CreatePairing(ctx, deviceSerial)
	return client.HandleOKResponse(&viewmodel.PairingCode{}, "pairing", resp, err)
}

func (clnt *PairingClient) GetPairing(ctx context.Context, pairingCode string) (*viewmodel.PairingStatus, error) {
	resp, err := clnt.RawClient.GetPairing(ctx, pairingCode)
	return client.HandleOKResponse(&viewmodel.PairingStatus{}, "pairing", resp, err)
}

func (clnt *PairingClient) LinkPrincipal(ctx context.Context, pairingCode, principalSerial string) error {
	resp, err := clnt.RawClient.LinkPrincipal(ctx, pairingCode, principalSerial)
	return client.HandleNoContentResponse("pairing", resp, err)
}

func (clnt *PairingClient) CompletePairing(ctx context.Context, pairingCode string) error {
	resp, err := clnt.RawClient.CompletePairing(ctx, pairingCode)
	return client.HandleNoContentResponse("pairing", resp, err)
}
