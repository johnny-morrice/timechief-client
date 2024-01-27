package sound

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/client/daemonclient"
	"gorm.io/gorm"
)

type Service struct {
	dc daemonclient.DaemonClient
	kv KeyValueStore
}

type KeyValueStore interface {
	Get(key string) (string, error)
}

func NewSoundService(dc daemonclient.DaemonClient, kv KeyValueStore) (Service, error) {
	if kv == nil {
		return Service{}, fmt.Errorf("kv is nil")
	}
	return Service{dc: dc, kv: kv}, nil
}

func (svc Service) isMuted() (bool, error) {
	mute, err := svc.kv.Get("mute")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	return mute == "true", nil
}

func (svc Service) isInUnmuteRange() (bool, error) {
	timeNow := time.Now()
	unmuteRange, err := svc.kv.Get("unmute-range")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	if unmuteRange == "" {
		return false, nil
	}
	rangeTimesText := strings.Split(unmuteRange, ",")
	if len(rangeTimesText) != 2 {
		return false, fmt.Errorf("unmute-range is invalid")
	}
	rangeTimes := make([]time.Time, 2)
	for i, rangeTimeText := range rangeTimesText {
		rangeTime, err := time.Parse(time.RFC3339, rangeTimeText)
		if err != nil {
			return false, err
		}
		rangeTimes[i] = rangeTime
	}
	unmuteStartTime := rangeTimes[0]
	unmuteEndTime := rangeTimes[1]
	isInRange := timeNow.After(unmuteStartTime) && timeNow.Before(unmuteEndTime)
	return isInRange, nil
}

func (svc Service) playSound(songName string) error {
	muted, err := svc.isMuted()
	if err != nil {
		return err
	}
	if muted {
		return nil
	}
	inRange, err := svc.isInUnmuteRange()
	if err != nil {
		return err
	}
	if !inRange {
		return nil
	}
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
