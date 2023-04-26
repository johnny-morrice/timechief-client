package system

import (
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system"
)

type Service struct {
	System         system.System
	StateFlagStore store.StateFlagStore
}

func (svc Service) Reboot() error {
	return svc.System.Reboot()
}
func (svc Service) Shutdown() error {
	return svc.System.Shutdown()
}

func (svc Service) WifiConnect() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-connect")
}

func (svc Service) WifiScan() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-scan")
}

func (svc Service) WifiHotspot() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-hotspot")
}

func (svc Service) WifiLoadInterfaces() error {
	return svc.StateFlagStore.CreateIfNotExists("wifi-load-interfaces")
}
