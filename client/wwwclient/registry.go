package wwwclient

import (
	"github.com/johnny-morrice/timechief/client/framework"
	"github.com/sarulabs/di/v2"
)

func Register(builder *di.Builder) error {
	return framework.RegisterAll(
		builder,
		RegisterRawClient,
		RegisterClient,
	)
}
