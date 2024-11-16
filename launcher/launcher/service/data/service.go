package data

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/media"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
	"gorm.io/gorm"
)

type Service struct {
	mediaService       MediaService
	deviceDataStore    DeviceDataStore
	launchTargetStore  store.LaunchTargetStore
	stateFlagStore     store.StateFlagStore
	keyValueStore      store.KeyValueStore
	wifiInterfaceStore store.WifiInterfaceStore
	wifiNetworkStore   store.WifiNetworkStore
	poker              Poker
}

func MakeService(mediaService MediaService, deviceDataStore DeviceDataStore, launchTargetStore store.LaunchTargetStore, stateFlagStore store.StateFlagStore, keyValueStore store.KeyValueStore, wifiInterfaceStore store.WifiInterfaceStore, wifiNetworkStore store.WifiNetworkStore, poker Poker) Service {
	return Service{
		mediaService:       mediaService,
		deviceDataStore:    deviceDataStore,
		launchTargetStore:  launchTargetStore,
		stateFlagStore:     stateFlagStore,
		keyValueStore:      keyValueStore,
		wifiInterfaceStore: wifiInterfaceStore,
		wifiNetworkStore:   wifiNetworkStore,
		poker:              poker,
	}
}

type Poker interface {
	Poke()
}

type MediaService interface {
	GetMedia() (media.Media, error)
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

type LauncherState struct {
	ActiveTargetVersion string        `json:"active_target_version"`
	SetupState          string        `json:"setup_state"`
	WebURL              string        `json:"web_url"`
	WifiState           WifiState     `json:"wifi_state"`
	NetworkState        NetworkState  `json:"network_state"`
	FirstTimeSetupDone  bool          `json:"first_time_setup_done"`
	Flags               []string      `json:"flags"`
	FirewallState       FirewallState `json:"firewall_state"`
}

type FirewallState struct {
	SSHEnabled bool `json:"ssh_enabled"`
	APIEnabled bool `json:"api_enabled"`
}

type NetworkState struct {
	IPAddress   string `json:"ip_address"`
	NetworkType string `json:"network_type"`
}

type WifiState struct {
	ActiveWifiInterface string        `json:"active_wifi_interface"`
	InterfaceMode       string        `json:"interface_mode"`
	ActiveSSID          string        `json:"active_ssid"`
	IsWifiError         bool          `json:"is_wifi_error"`
	HotspotSSID         string        `json:"hotspot_ssid"`
	HotspotKey          string        `json:"hotspot_key"`
	WifiNetworks        []WifiNetwork `json:"wifi_networks"`
}

type WifiNetwork struct {
	SSID           string `json:"ssid"`
	SignalStrength int    `json:"signal_strength"`
	Encryption     string `json:"encryption"`
}

type DeviceData struct {
	LauncherState    LauncherState    `json:"launcher_state"`
	ServiceData      v2.Data          `json:"service_data"`
	ServiceDataState ServiceDataState `json:"service_data_state"`
	Media            media.Media      `json:"media"`
}

type Theme struct {
	ThemeCSS string `json:"theme_css"`
}

type ServiceDataState struct {
	MyDeviceUUID   string      `json:"my_device_uuid"`
	MyDevices      []v2.Device `json:"my_devices"`
	HasAccessToken bool        `json:"has_access_token"`
}

type PairingStatus struct {
	Status    string `json:"status"`
	Code      string `json:"code"`
	URL       string `json:"url"`
	QRCodeURL string `json:"qr_code_url"`
}

func (svc Service) Logout() error {
	svc.poker.Poke()
	err := svc.keyValueStore.Delete(store.AccessTokenKey)
	if err != nil {
		return fmt.Errorf("failed to delete access token: %w", err)
	}
	err = svc.keyValueStore.Delete(store.DeviceUUIDKey)
	if err != nil {
		return fmt.Errorf("failed to delete device UUID: %w", err)
	}
	err = svc.keyValueStore.Delete(store.MyDevicesKey)
	if err != nil {
		return fmt.Errorf("failed to delete my devices key")
	}
	return nil
}

func (svc Service) SetLicenseActivationCode(code string) error {
	svc.poker.Poke()
	err := svc.keyValueStore.Set(store.LicenseActivationCodeKey, code)
	if err != nil {
		return fmt.Errorf("failed to set license activation code: %w", err)
	}
	return nil
}

func (svc Service) PairDevice() error {
	svc.poker.Poke()
	err := svc.keyValueStore.Delete(store.PairingDeviceCodeKey)
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
	svc.poker.Poke()
	url, err := svc.keyValueStore.Get(store.PairingURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing code: %w", err)
	}
	qrCodeURL, err := svc.keyValueStore.Get(store.PairingQRCodeURLKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return PairingStatus{}, fmt.Errorf("failed to get pairing URL: %w", err)
	}
	code, err := svc.keyValueStore.Get(store.PairingUserCodeKey)
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
	return fmt.Sprintf("https://%s/", ip)
}

func (svc Service) RefreshMyDevices() error {
	svc.poker.Poke()
	return svc.stateFlagStore.CreateIfNotExists("refresh-mydevices")
}

func (svc Service) SetMyDevice(deviceUUID string) error {
	svc.poker.Poke()
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
	svc.poker.Poke()
	deviceData, err := svc.deviceDataStore.GetDeviceData()
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to get device data from store: %w", err)
	}

	flags, err := svc.stateFlagStore.List()
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to get state flags: %w", err)
	}

	target, err := svc.launchTargetStore.GetActiveLaunchTarget()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get active launch target: %w", err)
	}

	wifiInterface, err := svc.wifiInterfaceStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get active wifi interface: %w", err)
	}

	storeNets, err := svc.wifiNetworkStore.List()
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to get wifi networks: %w", err)
	}

	activeNet, err := svc.wifiNetworkStore.GetActive()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get active wifi network: %w", err)
	}

	isWifiError, err := svc.stateFlagStore.Exists("wifi-error")
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to get wifi error flag: %w", err)
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
		return DeviceData{}, fmt.Errorf("failed to get ip address: %w", err)
	}

	interfaceMode, err := svc.keyValueStore.Get(store.InterfaceModeKey)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get interface mode: %w", err)
	}

	setupState, err := svc.keyValueStore.Get("setup")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get setup state: %w", err)
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

	media, err := svc.mediaService.GetMedia()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get media: %w", err)
	}

	networkType, err := svc.keyValueStore.Get("network-type")
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return DeviceData{}, fmt.Errorf("failed to get network-type: %w", err)
	}

	apiFirewallOpenText, err := svc.keyValueStore.Get("firewall-open-http")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			apiFirewallOpenText = "false"
		} else {
			return DeviceData{}, fmt.Errorf("failed to get API firewall state: %w", err)
		}
	}

	isAPIFirewallOpen, err := strconv.ParseBool(apiFirewallOpenText)
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to parse API firewall open bool: %w", err)
	}

	sshFirewallOpenText, err := svc.keyValueStore.Get("firewall-open-ssh")
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			sshFirewallOpenText = "false"
		} else {
			return DeviceData{}, fmt.Errorf("failed to get SSH firewall state: %w", err)
		}
	}

	isSSHFirewallOpen, err := strconv.ParseBool(sshFirewallOpenText)
	if err != nil {
		return DeviceData{}, fmt.Errorf("failed to parse SSH firewall open bool: %w", err)
	}

	result := DeviceData{
		Media:       media,
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
				IPAddress:   ipAddress,
				NetworkType: networkType,
			},
			FirewallState: FirewallState{
				SSHEnabled: isSSHFirewallOpen,
				APIEnabled: isAPIFirewallOpen,
			},
		},
	}

	return result, nil
}
