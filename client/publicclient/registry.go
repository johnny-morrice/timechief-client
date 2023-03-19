package publicclient

import (
	"github.com/johnny-morrice/timechief-client/client/framework"
	"github.com/sarulabs/di/v2"
)

func Register(builder *di.Builder) error {
	return framework.RegisterAll(
		builder,
		RegisterRawClient,
		RegisterClient,
	)
}
