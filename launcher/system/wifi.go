package system

import (
	"fmt"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system/netcmd"
)

type WifiInterface struct {
	Config    store.Config
	Interface string
}

func (card WifiInterface) netCmd() netcmd.NetCmd {
	return cfgNetCmd(card.Config)
}

func cfgNetCmd(cfg store.Config) netcmd.NetCmd {
	root := filepath.Join(cfg.GetInstallRoot(), "bin")
	return netcmd.NetCmd{
		BasePath: root,
	}
}

func (card WifiInterface) ScanWifiNetworks() ([]WifiNetwork, error) {
	nmNets, err := card.netCmd().Scan(card.Interface)
	if err != nil {
		return nil, fmt.Errorf("failed to scan wifi networks: %w", err)
	}
	result := make([]WifiNetwork, len(nmNets))
	for i, nmNet := range nmNets {
		result[i] = WifiNetwork{
			SSID: nmNet.SSID,
		}
	}
	return result, nil
}

func (card WifiInterface) Connect(net WifiNetwork) error {
	result, err := card.netCmd().ConnectToWifi(net.SSID, net.Key, card.Interface)
	if err != nil {
		return fmt.Errorf("failed to connect to wifi: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("failed to connect to wifi: %s", result.Message)
	}
	return nil
}

func (card WifiInterface) Hotspot(net WifiNetwork) error {
	result, err := card.netCmd().Hotspot(net.SSID, net.Key, card.Interface)
	if err != nil {
		return fmt.Errorf("failed to create hotspot: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("failed to create hotspot: %s", result.Message)
	}
	return nil
}

func (card WifiInterface) GetIPAddress() (string, error) {
	net, err := card.netCmd().ReadWifiInterface(card.Interface)
	if err != nil {
		return "", fmt.Errorf("failed to read wifi interface: %w", err)
	}
	return net.IPV4Address, nil
}

type WifiNetwork struct {
	SSID string
	Key  string
}

func ReadWifiInterfaces(cfg store.Config) ([]WifiInterface, error) {
	nmIfaces, err := cfgNetCmd(cfg).ReadWifiInterfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to read wifi interfaces: %w", err)
	}
	result := make([]WifiInterface, len(nmIfaces))
	for i, nmIface := range nmIfaces {
		result[i] = WifiInterface{
			Interface: nmIface.Device,
		}
	}
	return result, nil
}
