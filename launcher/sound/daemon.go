package sound

import "context"

type Daemon struct {
	ListenAddr       string
	PlayStartupSound bool
}

func (daemon Daemon) Run(ctx context.Context) error {
	panic("not implemented")
}
