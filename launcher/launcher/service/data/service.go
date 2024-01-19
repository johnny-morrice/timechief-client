package data

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	deviceDataStore    DeviceDataStore
	launchTargetStore  store.LaunchTargetStore
	stateFlagStore     store.StateFlagStore
	keyValueStore      store.KeyValueStore
	wifiInterfaceStore store.WifiInterfaceStore
	wifiNetworkStore   store.WifiNetworkStore
}

func MakeService(deviceDataStore DeviceDataStore, launchTargetStore store.LaunchTargetStore, stateFlagStore store.StateFlagStore, keyValueStore store.KeyValueStore, wifiInterfaceStore store.WifiInterfaceStore, wifiNetworkStore store.WifiNetworkStore) Service {
	return Service{
		deviceDataStore:    deviceDataStore,
		launchTargetStore:  launchTargetStore,
		stateFlagStore:     stateFlagStore,
		keyValueStore:      keyValueStore,
		wifiInterfaceStore: wifiInterfaceStore,
		wifiNetworkStore:   wifiNetworkStore,
	}
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
	Encryption     string
}

type DeviceData struct {
	LauncherState    LauncherState
	ServiceData      v2.Data
	ServiceDataState ServiceDataState
}

type ServiceDataState struct {
	MyDeviceUUID   string
	MyDevices      []v2.Device
	HasAccessToken bool
}

type PairingStatus struct {
	Status    string
	Code      string
	URL       string
	QRCodeURL string
}

func (svc Service) Logout() error {
	return svc.keyValueStore.Delete(store.AccessTokenKey)
}

func (svc Service) SetLicenseActivationCode(code string) error {
	err := svc.keyValueStore.Set(store.LicenseActivationCodeKey, code)
	if err != nil {
		return fmt.Errorf("failed to set license activation code: %w", err)
	}
	return nil
}

func (svc Service) PairDevice() error {
	err := svc.keyValueStore.Delete(store.PairingCodeKey)
	if err != nil {
		return fmt.Errorf("failed to delete pairing code: %w", err)
	}
	err = svc.stateFlagStore.CreateIfNotExists("pairing-requested")
	if err != nil {
		return fmt.Errorf("failed to create pairing-requested flag: %w", err)
	}
	return nil
}

func (svc Service) GetPairingStatus() (PairingStatus, error) {
	url, err := svc.keyValueStore.Get(store.PairingURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}
	qrCodeURL, err := svc.keyValueStore.Get(store.PairingQRCodeURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}
	code, err := svc.keyValueStore.Get(store.PairingCodeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}

	isPairing, err := svc.stateFlagStore.Exists("pairing-requested")

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

func (svc Service) RefreshMyDevices() error {
	return svc.stateFlagStore.CreateIfNotExists("refresh-mydevices")
}

func (svc Service) SetMyDevice(deviceUUID string) error {
	// Verify UUID is valid UUID
	_, err := uuid.Parse(deviceUUID)
	if err != nil {
		return fmt.Errorf("invalid device UUID: %w", err)
	}
	err = svc.keyValueStore.Set(store.DeviceUUIDKey, deviceUUID)
	if err != nil {
		return err
	}
	return nil
}

func (svc Service) GetDeviceData() (DeviceData, error) {
	deviceData, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return DeviceData{}, err
	}

	flags, err := svc.stateFlagStore.List()
	if err != nil {
		return DeviceData{}, err
	}

	target, err := svc.launchTargetStore.GetActiveLaunchTarget()

	if err != nil {
		return DeviceData{}, err
	}

	wifiInterface, err := svc.wifiInterfaceStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	storeNets, err := svc.wifiNetworkStore.List()
	if err != nil {
		return DeviceData{}, err
	}

	activeNet, err := svc.wifiNetworkStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	isWifiError, err := svc.stateFlagStore.Exists("wifi-error")
	if err != nil {
		return DeviceData{}, err
	}

	networks := make([]WifiNetwork, len(storeNets))
	for i, storeNet := range storeNets {
		networks[i] = WifiNetwork{
			SSID:           storeNet.SSID,
			SignalStrength: storeNet.Signal,
			Encryption:     storeNet.Encryption,
		}
	}

	ipAddress, err := svc.keyValueStore.Get(store.IPAddressKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	interfaceMode, err := svc.keyValueStore.Get(store.InterfaceModeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	setupState, err := svc.keyValueStore.Get("setup")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, err
	}

	hotspotSSID, err := svc.keyValueStore.Get(store.HotspotSSID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get hotspot ssid: %w", err)
	}

	hotspotKey, err := svc.keyValueStore.Get(store.HotspotKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get hotspot key: %w", err)
	}

	_, err = svc.keyValueStore.Get("firstTimeSetupDone")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get firstTimeSetupDone: %w", err)
	}
	firstTimeSetupDone := !errors.Is(err, gorm.ErrRecordNotFound)

	myDeviceUUID, err := svc.keyValueStore.Get(store.DeviceUUIDKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get my device uuid: %w", err)
	}
	myDevicesJSON, err := svc.keyValueStore.Get(store.MyDevicesKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get my devices: %w", err)
	}
	var myDevices []v2.Device
	if myDevicesJSON != "" {
		err = json.Unmarshal([]byte(myDevicesJSON), &myDevices)
		if err != nil {
			return DeviceData{}, fmt.Errorf("failed to unmarshal my devices: %w", err)
		}
	}
	accessToken, err := svc.keyValueStore.Get(store.AccessTokenKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get access token: %w", err)
	}

	result := DeviceData{
		ServiceData: deviceData,
		ServiceDataState: ServiceDataState{
			MyDeviceUUID:   myDeviceUUID,
			MyDevices:      myDevices,
			HasAccessToken: accessToken != "",
		},
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
