package daemon

import (
	"time"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/urfave/cli/v2"
)

type DeviceData struct {
	DeviceDataStore store.DeviceDataStore
}

func (dd DeviceData) Start(ctx *cli.Context) {
	dd.doTick(ctx)
	const interval = time.Second * 15
	runEvery(interval, func() { dd.doTick(ctx) })
}

func (dd DeviceData) doTick(ctx *cli.Context) error {
	data, err := dd.FetchLatest()
	if err != nil {
		return err
	}
	err = dd.DeviceDataStore.SetDeviceData(data)
	if err != nil {
		return err
	}
	return nil

}

func (dd DeviceData) FetchLatest() (viewmodel.ClockData, error) {
	return viewmodel.ClockData{}, nil
}
