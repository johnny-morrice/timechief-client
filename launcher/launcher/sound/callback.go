package sound

import "time"

type ShutdownCallback struct {
	svc Service
}

func NewShutdownCallback(svc Service) ShutdownCallback {
	return ShutdownCallback{svc: svc}
}

func (cb ShutdownCallback) OnShutdown() error {
	err := cb.svc.PlayShutdown()
	if err != nil {
		return err
	}
	// Wait for sound to play.
	const waitDuration = 5 * time.Second
	time.Sleep(waitDuration)
	return nil
}
