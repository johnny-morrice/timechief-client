package framework

import (
	"github.com/sarulabs/di/v2"
)

const (
	Logger = "Logger"
	Config = "Config"

	RawRestClient      = "RawRestClient"
	RestClient         = "RestClient"
	RawCoreClient      = "RawCoreClient"
	CoreClient         = "CoreClient"
	CoreClientConfig   = "CoreClientConfig"
	AuthnClient        = "AuthnClient"
	RawAuthnClient     = "RawAuthnClient"
	AuthnClientConfig  = "AuthnClientConfig"
	APIClient          = "APIClient"
	RawAPIClient       = "RawAPIClient"
	APIClientConfig    = "APIClientConfig"
	RawWorldClient     = "RawWorldClient"
	WorldClient        = "WorldClient"
	WorldClientConfig  = "WorldClientConfig"
	WwwClientConfig    = "WwwClientConfig"
	RawWwwClient       = "RawWwwClient"
	WwwClient          = "WwwClient"
	PublicClientConfig = "PublicClientConfig"
	RawPublicClient    = "RawPublicClient"
)

type RegisterFunc func(*di.Builder) error

func RegisterAll(builder *di.Builder, registrations ...RegisterFunc) error {
	for _, reg := range registrations {
		err := reg(builder)
		if err != nil {
			return err
		}
	}
	return nil
}
