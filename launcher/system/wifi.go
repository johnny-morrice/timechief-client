package system

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/system/nmcli"
)

type WifiInterface struct {
	Interface string
}

func (card WifiInterface) ScanWifiNetworks() ([]WifiNetwork, error) {
	nmNets, err := nmcli.ScanWifiNetworks(card.Interface)
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
	result, err := nmcli.ConnectToWifi(net.SSID, net.Key, card.Interface)
	if err != nil {
		return fmt.Errorf("failed to connect to wifi: %w", err)
	}
	if !result.Success {
		return fmt.Errorf("failed to connect to wifi: %s", result.Message)
	}
	return nil
}

type WifiNetwork struct {
	SSID string
	Key  string
}

func ReadWifiInterfaces() ([]WifiInterface, error) {
	nmIfaces, err := nmcli.ReadWifiInterfaces()
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
