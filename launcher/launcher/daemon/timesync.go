package daemon

import (
	"log"
	"time"

	"github.com/urfave/cli/v2"
)

type TimeSync struct {
	RefreshInterval time.Duration
	Syncer          RTCSyncer
}

type RTCSyncer interface {
	SyncRTC() error
}

func (daemon TimeSync) Start(ctx *cli.Context) {
	if daemon.RefreshInterval == 0 {
		daemon.RefreshInterval = 5 * time.Second
	}
	runEvery(daemon.RefreshInterval, func() {
		daemon.doTick()
	})
}

// If the time is previous to 2023, sync the time with the RTC.
func (daemon TimeSync) doTick() {
	now := time.Now()
	if now.Year() < 2023 {
		log.Println("syncing time from rtc")
		err := daemon.Syncer.SyncRTC()
		if err != nil {
			log.Printf("time sync error: %s", err)
		}
	}
}
