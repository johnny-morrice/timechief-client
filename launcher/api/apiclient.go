package api

import (
	"time"

	"github.com/sarulabs/di/v2"

	"github.com/johnny-morrice/timechief-client/client/client"
	"github.com/johnny-morrice/timechief-client/client/publicclient"
	"github.com/johnny-morrice/timechief-client/launcher/store"
)

func MakePublicClient(cfg store.Config) (*publicclient.Client, error) {
	builder, err := di.NewBuilder()
	if err != nil {
		return nil, err
	}
	// TODO we should load these values from the config.
	clientConfig := client.ClientConfig{
		BaseURL:          cfg.GetAPIBaseURL(),
		HTTPTimeout:      30 * time.Second,
		RetryWaitTime:    5 * time.Second,
		RetryMaxWaitTime: 30 * time.Second,
		RetryCount:       5,
		DumpHTTP:         true,
	}
	apiConfig := publicclient.MakePublicClientConfig(clientConfig)
	err = apiConfig.Register(builder)
	if err != nil {
		return nil, err
	}
	err = publicclient.Register(builder)
	if err != nil {
		return nil, err
	}
	app := builder.Build()
	client := publicclient.GetClient(app)
	return client, nil
}
