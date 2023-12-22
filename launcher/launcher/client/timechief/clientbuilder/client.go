package clientbuilder

import (
	"context"
	"fmt"
	"net/http"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type TimechiefClientBuilder struct {
	cfgStore ConfigStore
	kvStore  store.KeyValueStore
	noAuth   bool
}

func MakeTimechiefClientBuilder(cfgStore ConfigStore, kvStore store.KeyValueStore) TimechiefClientBuilder {
	return TimechiefClientBuilder{
		cfgStore: cfgStore,
		kvStore:  kvStore,
	}
}

func (builder TimechiefClientBuilder) UseAuth(useAuth bool) TimechiefClientBuilder {
	builder.noAuth = !useAuth
	return builder
}

func (builder TimechiefClientBuilder) Build() (v2.ClientInterface, error) {
	cfg, err := builder.cfgStore.GetConfig()
	if err != nil {
		return nil, err
	}
	options := []v2.ClientOption{}
	if !builder.noAuth {
		options = append(options, accessTokenOption(builder.kvStore))
	}
	client, err := v2.NewClient(cfg.GetAPIBaseURL(), options...)
	if err != nil {
		return nil, err
	}
	return client, nil
}

type ConfigStore interface {
	GetConfig() (store.Config, error)
}

func accessTokenOption(kvStore store.KeyValueStore) v2.ClientOption {
	return func(c *v2.Client) error {
		c.RequestEditors = append(c.RequestEditors, func(ctx context.Context, req *http.Request) error {
			accessToken, err := kvStore.Get(store.AccessTokenKey)
			if err != nil {
				return fmt.Errorf("failed to get access token in request editor: %v", err)
			}
			req.Header.Set("Authorization", "Bearer "+accessToken)
			return nil
		})
		return nil
	}
}
