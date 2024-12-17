package clientbuilder

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/authzero"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Builder struct {
	cfgStore ConfigStore
	kvStore  store.KeyValueStore
	noAuth   bool
}

func (builder Builder) CfgStore(cfgStore ConfigStore) Builder {
	builder.cfgStore = cfgStore
	return builder
}

func (builder Builder) KVStore(kvStore store.KeyValueStore) Builder {
	builder.kvStore = kvStore
	return builder
}

func (builder Builder) UseAuth(useAuth bool) Builder {
	builder.noAuth = !useAuth
	return builder
}

func (builder Builder) Build() (v2.ClientInterface, error) {
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
			accessTokenText, err := kvStore.Get(store.AccessTokenKey)
			if err != nil {
				return fmt.Errorf("failed to get access token in request editor: %v", err)
			}
			accessToken := authzero.AccessTokenResp{}
			err = json.Unmarshal([]byte(accessTokenText), &accessToken)
			if err != nil {
				return fmt.Errorf("failed to decode access token: %v", err)
			}
			req.Header.Set("Authorization", "Bearer "+accessToken.AccessToken)
			return nil
		})
		return nil
	}
}
