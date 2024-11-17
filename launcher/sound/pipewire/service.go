package pipewire

import "github.com/johnny-morrice/timechief-client/launcher/sound/song"

type Service struct {
}

func MakeSoundService(doFirstTimeSetup bool, volume float64) (Service, error) {
	panic("not implemented")
}

func (svc Service) Initialise() error {
	panic("not implemented")
}
func (svc Service) StartSong(songOpts song.Options) error {
	panic("not implemented")
}
func (svc Service) StopSong() error {
	panic("not implemented")
}
func (svc Service) Finalise() error {
	panic("not implemented")
}
