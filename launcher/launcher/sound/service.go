package sound

import "github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"

type Service struct {
	dc daemonclient.DaemonClient
}

func NewSoundService(dc daemonclient.DaemonClient) Service {
	return Service{dc: dc}
}

func (svc Service) playSound(songName string) error {
	req := daemonclient.PlaySoundRequest{
		SongName: songName,
	}
	return svc.dc.PostPlaySound(req)
}

func (svc Service) PlayStartup() error {
	return svc.playSound("startup")
}

func (svc Service) PlayShutdown() error {
	return svc.playSound("shutdown")
}

func (svc Service) PlayLogin() error {
	return svc.playSound("login")
}
