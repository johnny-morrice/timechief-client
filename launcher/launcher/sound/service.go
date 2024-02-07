package sound

import (
	"errors"
	"fmt"
	"log"
	"strconv"
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
	unmuteRangeParts := strings.Split(unmuteRange, "-")
	if len(unmuteRangeParts) != 2 {
		return false, fmt.Errorf("invalid unmute range %v", unmuteRange)
	}
	unmuteHours := [2]int{}
	for i, part := range unmuteRangeParts {
		unmuteHour, err := strconv.ParseInt(part, 10, 32)
		if err != nil {
			return false, fmt.Errorf("invalid unmute range %v", unmuteRange)
		}
		unmuteHours[i] = int(unmuteHour)
	}
	startHour := unmuteHours[0]
	endHour := unmuteHours[1]
	currentTime := time.Now()
	isInRange := currentTime.Hour() >= startHour && currentTime.Hour() < endHour
	return isInRange, nil
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

func (svc Service) PlayStartup() error {
	return svc.playSound("startup")
}

func (svc Service) PlayShutdown() error {
	return svc.playSound("shutdown")
}

func (svc Service) PlayLogin() error {
	return svc.playSound("login")
}
