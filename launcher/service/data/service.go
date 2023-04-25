package data

import (
	"errors"
	"fmt"

	"github.com/johnny-morrice/timechief-client/client/viewmodel"
	"github.com/johnny-morrice/timechief-client/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	DeviceDataStore    store.DeviceDataStore
	LaunchTargetStore  store.LaunchTargetStore
	StateFlagStore     store.StateFlagStore
	KeyValueStore      store.KeyValueStore
	WifiInterfaceStore store.WifiInterfaceStore
	WifiNetworkStore   store.WifiNetworkStore
}

type LauncherState struct {
	Flags               []string
	ActiveTargetVersion string
	WifiState           WifiState
}

type WifiState struct {
	ActiveWifiInterface string
	ActiveSSID          string
	WifiNetworks        []WifiNetwork
}

type WifiNetwork struct {
	SSID           string
	SignalStrength int
}

type DeviceData struct {
	ServiceData   viewmodel.ClockData
	LauncherState LauncherState
}

type PairingStatus struct {
	Status string
	Code   string
}

func (svc Service) PairDevice() error {
	err := svc.KeyValueStore.Delete(store.PairingCodeKey)
	if err != nil {
		return fmt.Errorf("failed to delete pairing code: %w", err)
	}
	err = svc.StateFlagStore.CreateIfNotExists("pairing-requested")
	if err != nil {
		return fmt.Errorf("failed to create pairing-requested flag: %w", err)
	}
	return nil
}

func (svc Service) GetPairingStatus() (PairingStatus, error) {
	code, err := svc.KeyValueStore.Get(store.PairingCodeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}

	isPairing, err := svc.StateFlagStore.Exists("pairing-requested")

	if err != nil {
		return PairingStatus{}, fmt.Errorf("failed to check pairing-requested flag: %w", err)
	}

	status := "none"
	if isPairing {
		status = "ready"
	}

	result := PairingStatus{
		Status: status,
		Code:   code,
	}

	return result, nil
}

func (svc Service) GetDeviceData() (DeviceData, error) {
	clockData, err := svc.DeviceDataStore.GetDeviceData()
	if err != nil {
		return DeviceData{}, err
	}

	flags, err := svc.StateFlagStore.List()
	if err != nil {
		return DeviceData{}, err
	}

	target, err := svc.LaunchTargetStore.GetActiveLaunchTarget()

	if err != nil {
		return DeviceData{}, err
	}

	wifiInterface, err := svc.WifiInterfaceStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	storeNets, err := svc.WifiNetworkStore.List()
	if err != nil {
		return DeviceData{}, err
	}

	activeNet, err := svc.WifiNetworkStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	networks := make([]WifiNetwork, len(storeNets))
	for i, storeNet := range storeNets {
		networks[i] = WifiNetwork{
			SSID:           storeNet.SSID,
			SignalStrength: storeNet.SignalStrength,
		}
	}

	result := DeviceData{
		ServiceData: clockData,
		LauncherState: LauncherState{
			Flags:               flags,
			ActiveTargetVersion: target.Version.Details(),
			WifiState: WifiState{
				ActiveWifiInterface: wifiInterface.Interface,
				ActiveSSID:          activeNet.SSID,
				WifiNetworks:        networks,
			},
		},
	}

	return result, nil
}
