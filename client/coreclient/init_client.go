package coreclient

import (
	"context"
	"fmt"
	"net/http"

	"github.com/johnny-morrice/timechief/client"
)

type InitClient struct {
	*client.RestClient
}

func (client *InitClient) Initialise(ctx context.Context) error {
	resp, err := client.Request(ctx).Post(client.Config.BaseURL + "/initialise")
	if err != nil {
		return err
	}
	if resp.StatusCode() != http.StatusCreated {
		return fmt.Errorf("expected status %v but was %v", http.StatusCreated, resp.StatusCode())
	}
	return nil
}
