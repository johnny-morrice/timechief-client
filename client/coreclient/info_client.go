package coreclient

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/pkg/errors"
)

type InfoClient struct {
	Build *InfoBuildClient
}

type InfoBuildClient struct {
	*client.RestClient
}

func (infoClient *InfoBuildClient) Get(ctx context.Context) (*viewmodel.BuildInfo, error) {
	output := &viewmodel.BuildInfo{}
	resp, err := infoClient.Request(ctx).Get(infoClient.Config.BaseURL + "/info/build")
	if err != nil {
		return nil, err
	}

	infoClient.LogResty(resp)
	if resp.StatusCode() != http.StatusOK {
		return nil, client.BadStatusError(resp.StatusCode(), http.StatusOK)
	}
	err = json.NewDecoder(bytes.NewBuffer(resp.Body())).Decode(output)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to decode build info")
	}
	return output, nil
}
