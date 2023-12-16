package data

import (
	"errors"
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	DeviceDataStore    DeviceDataStore
	LaunchTargetStore  store.LaunchTargetStore
	StateFlagStore     store.StateFlagStore
	KeyValueStore      store.KeyValueStore
	WifiInterfaceStore store.WifiInterfaceStore
	WifiNetworkStore   store.WifiNetworkStore
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

type LauncherState struct {
	ActiveTargetVersion string
	SetupState          string
	WebURL              string
	WifiState           WifiState
	NetworkState        NetworkState
	FirstTimeSetupDone  bool
	Flags               []string
}

type KeyValuePair struct {
	Key   string
	Value string
}

type NetworkState struct {
	IPAddress string
}

type WifiState struct {
	ActiveWifiInterface string
	InterfaceMode       string
	ActiveSSID          string
	IsWifiError         bool
	HotspotSSID         string
	HotspotKey          string
	WifiNetworks        []WifiNetwork
}

type WifiNetwork struct {
	SSID           string
	SignalStrength int
}

type DeviceData struct {
	LauncherState LauncherState
	ServiceData   v2.Data
}

type PairingStatus struct {
	Status    string
	Code      string
	URL       string
	QRCodeURL string
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
	url, err := svc.KeyValueStore.Get(store.PairingURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}
	qrCodeURL, err := svc.KeyValueStore.Get(store.PairingQRCodeURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}
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
		Status:    status,
		Code:      code,
		URL:       url,
		QRCodeURL: qrCodeURL,
	}

	return result, nil
}

func webURL(ip string) string {
	if ip == "" {
		return ""
	}
	return fmt.Sprintf("http://%s/", ip)
}

func (svc Service) GetDeviceData() (DeviceData, error) {
	deviceData, err := svc.DeviceDataStore.GetDeviceData()
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

	isWifiError, err := svc.StateFlagStore.Exists("wifi-error")
	if err != nil {
		return DeviceData{}, err
	}

	networks := make([]WifiNetwork, len(storeNets))
	for i, storeNet := range storeNets {
		networks[i] = WifiNetwork{
			SSID:           storeNet.SSID,
			SignalStrength: storeNet.Signal,
		}
	}

	ipAddress, err := svc.KeyValueStore.Get(store.IPAddressKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	interfaceMode, err := svc.KeyValueStore.Get(store.InterfaceModeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	setupState, err := svc.KeyValueStore.Get("setup")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	hotspotSSID, err := svc.KeyValueStore.Get(store.HotspotSSID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get hotspot ssid: %w", err)
	}

	hotspotKey, err := svc.KeyValueStore.Get(store.HotspotKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get hotspot key: %w", err)
	}

	_, err = svc.KeyValueStore.Get("firstTimeSetupDone")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get firstTimeSetupDone: %w", err)
	}
	firstTimeSetupDone := !errors.Is(err, gorm.ErrRecordNotFound)

	result := DeviceData{
		ServiceData: deviceData,
		LauncherState: LauncherState{
			WebURL:              webURL(ipAddress),
			SetupState:          setupState,
			Flags:               flags,
			ActiveTargetVersion: target.Version.Details(),
			WifiState: WifiState{
				ActiveWifiInterface: wifiInterface.Interface,
				InterfaceMode:       interfaceMode,
				ActiveSSID:          activeNet.SSID,
				IsWifiError:         isWifiError,
				WifiNetworks:        networks,
				HotspotSSID:         hotspotSSID,
				HotspotKey:          hotspotKey,
			},
			FirstTimeSetupDone: firstTimeSetupDone,
			NetworkState: NetworkState{
				IPAddress: ipAddress,
			},
		},
	}

	return result, nil
}
