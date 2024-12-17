package sound

import (
	"errors"
	"fmt"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/util"
	"gorm.io/gorm"
)

type Service struct {
	dc daemonclient.DaemonClient
	kv KeyValueStore
}

type KeyValueStore interface {
	Get(key string) (string, error)
	Set(key, value string) error
}

func NewSoundService(dc daemonclient.DaemonClient, kv KeyValueStore) (Service, error) {
	if kv == nil {
		return Service{}, fmt.Errorf("kv is nil")
	}
	return Service{dc: dc, kv: kv}, nil
}

type MuteOptions struct {
	IsMute        bool
	IsMuteRange   bool
	MuteStartHour uint
	MuteEndHour   uint
}

func (svc Service) SetMuteOptions(option MuteOptions) error {
	var err error
	if option.IsMute {
		err = svc.kv.Set("mute", "true")
	} else {
		err = svc.kv.Set("mute", "false")
	}
	if err != nil {
		return fmt.Errorf("set mute option: %w", err)
	}
	if option.IsMuteRange {
		// Swap mute start and mute end hours.
		err = svc.kv.Set("unmute-range", fmt.Sprintf("%d,%d", option.MuteEndHour, option.MuteStartHour))
	} else {
		err = svc.kv.Set("unmute-range", "")
	}
	if err != nil {
		return fmt.Errorf("set mute range option: %w", err)
	}
	return nil
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

func (svc Service) isMuted() (bool, error) {
	mute, err := svc.kv.Get("mute")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	return mute == "true", nil
}

func (svc Service) isInUnmuteRange() (bool, error) {
	// unmuteRange is startHour,endHour
	unmuteRange, err := svc.kv.Get("unmute-range")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	// If not set, then always in range.
	// This means you get a startup sound if the device is uninitialised.
	// The setup daemon should set a reasonable unmute range.
	if unmuteRange == "" {
		return true, nil
	}
	return util.IsInHourRange(unmuteRange)
}

func (svc Service) playSound(songName string) error {
	muted, err := svc.isMuted()
	if err != nil {
		return err
	}
	if muted {
		log.Printf("sound is muted, not playing %v", songName)
		return nil
	}
	inRange, err := svc.isInUnmuteRange()
	if err != nil {
		return err
	}
	if !inRange {
		log.Printf("sound is not in unmute range, not playing %v", songName)
		return nil
	}
	req := daemonclient.PlaySoundRequest{
		SongName: songName,
	}
	return svc.dc.PostPlaySound(req)
}
