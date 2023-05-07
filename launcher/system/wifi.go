package system

import (
	"fmt"
	"log"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"github.com/johnny-morrice/timechief-client/launcher/system/netcmd"
)

type WifiInterface struct {
	Config    store.Config
	Interface string
}

func (card WifiInterface) netCmd() netcmd.NetCmd {
	return netcmd.NewNetCmd(card.Config)
}

func (card WifiInterface) ScanWifiNetworks() ([]WifiNetwork, error) {
	nmNets, err := card.netCmd().Scan(card.Interface)
	if err != nil {
		return nil, fmt.Errorf("failed to scan wifi networks: %w", err)
	}
	result := make([]WifiNetwork, len(nmNets))
	for i, nmNet := range nmNets {
		if nmNet.Security != "WPA2" {
			log.Printf("Skipping network %s with security %s", nmNet.SSID, nmNet.Security)
			continue
		}
		result[i] = WifiNetwork{
			SSID:   nmNet.SSID,
			Signal: nmNet.Signal,
		}
	}
	return result, nil
}

func (card WifiInterface) Connect(net WifiNetwork) error {
	err := card.netCmd().ConnectToWifi(net.SSID, net.Key, card.Interface)
	if err != nil {
		return fmt.Errorf("failed to connect to wifi: %w", err)
	}
	return nil
}

// TODO: Make these configurable
const accessPointIPAddress = "172.16.0.1/24"
const dhcpRange = "172.16.0.100,172.16.0.200,12h"

func (card WifiInterface) Hotspot(net WifiNetwork) error {
	err := card.netCmd().Hotspot(net.SSID, net.Key, card.Interface, accessPointIPAddress, dhcpRange)
	if err != nil {
		return fmt.Errorf("failed to create hotspot: %w", err)
	}
	return nil
}

func (card WifiInterface) NetworkStatus() (NetworkStatus, error) {
	net, err := card.netCmd().ReadWifiInterface(card.Interface)
	if err != nil {
		return NetworkStatus{}, fmt.Errorf("failed to read wifi interface: %w", err)
	}
	status := NetworkStatus{
		IPV4Address: net.IPV4Address,
		Mode:        net.Mode,
	}
	return status, nil
}

type NetworkStatus struct {
	IPV4Address string
	Mode        string
}

type WifiNetwork struct {
	SSID   string
	Key    string
	Signal int
}

func ReadWifiInterfaces(cfg store.Config) ([]WifiInterface, error) {
	nmIfaces, err := netcmd.NewNetCmd(cfg).ReadWifiInterfaces()
	if err != nil {
		return nil, fmt.Errorf("failed to read wifi interfaces: %w", err)
	}
	result := make([]WifiInterface, len(nmIfaces))
	for i, nmIface := range nmIfaces {
		result[i] = WifiInterface{
			Config:    cfg,
			Interface: nmIface.Device,
		}
	}
	return result, nil
}
