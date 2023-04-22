package nmcli

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strings"
)

func ScanWifiNetworks(ifname string) ([]WiFiNetwork, error) {
	// nmcli -g json device wifi rescan ifname <interface>
	result := []WiFiNetwork{}
	err := parseExecute(&result, "nmcli", "-g", "json", "device", "wifi", "rescan", "ifname", ifname)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func ReadWifiInterfaces() ([]WiFiInterface, error) {
	// nmcli -g json device wifi list
	result := []WiFiInterface{}
	err := parseExecute(&result, "nmcli", "-g", "json", "device", "wifi", "list")
	if err != nil {
		return nil, err
	}
	return result, nil
}

func ConnectToWifi(ssid, password, ifname string) (WiFiConnectResult, error) {
	// nmcli -g json device wifi connect <SSID> password <password> ifname <interface>
	result := WiFiConnectResult{}
	err := parseExecute(&result, "nmcli", "-g", "json", "device", "wifi", "connect", ssid, "password", password, "ifname", ifname)
	if err != nil {
		return WiFiConnectResult{}, err
	}
	return result, nil
}

func Hotspot(ssid, password, ifname string) (HotspotConnection, error) {
	// nmcli device wifi hotspot ssid <SSID> password <password> ifname <interface>
	result := HotspotConnection{}
	err := parseExecute(&result, "nmcli", "-g", "json", "device", "wifi", "hotspot", "ssid", ssid, "password", password, "ifname", ifname)
	if err != nil {
		return HotspotConnection{}, err
	}
	return result, nil
}

func NetworkInterface(ifname string) (NetInterface, error) {
	// nmcli -g json device show <interface>
	result := NetInterface{}
	err := parseExecute(&result, "nmcli", "-g", "json", "device", "show", ifname)
	if err != nil {
		return NetInterface{}, err
	}
	return result, nil
}

func parseExecute(out interface{}, command string, args ...string) error {
	bs, err := execute(command, args...)
	if err != nil {
		return err
	}
	err = json.Unmarshal(bs, out)
	if err != nil {
		return fmt.Errorf("failed to parse output of %s %s: %w", command, strings.Join(args, " "), err)
	}
	return nil
}

// execute uses os.exec to execute a command.
func execute(command string, args ...string) ([]byte, error) {
	stderrBuf := bytes.Buffer{}
	stdoutBuf := bytes.Buffer{}
	cmd := exec.Cmd{
		Path:   command,
		Args:   args,
		Stderr: &stderrBuf,
		Stdout: &stdoutBuf,
	}
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to execute %s %s: %w", command, strings.Join(args, " "), err)
	}

	errBytes := stderrBuf.Bytes()
	if len(errBytes) > 0 {
		log.Printf("%s %s stderr: %s", command, strings.Join(args, " "), errBytes)
	}

	return stdoutBuf.Bytes(), nil
}

type NetInterface struct {
	Device struct {
		Type   string `json:"type"`
		Name   string `json:"name"`
		Driver string `json:"driver"`
		State  string `json:"state"`
		IP4    struct {
			Address []struct {
				IP      string `json:"ip"`
				Prefix  int    `json:"prefix"`
				Gateway string `json:"gateway"`
			} `json:"address"`
		} `json:"ip4"`
		IP6 struct {
			Address []struct {
				IP     string `json:"ip"`
				Prefix int    `json:"prefix"`
				Scope  string `json:"scope"`
			} `json:"address"`
		} `json:"ip6"`
		Wifi struct {
			SSID string `json:"ssid"`
			Mode string `json:"mode"`
			Chan int    `json:"chan"`
			Rate int    `json:"rate"`
		} `json:"wifi"`
	} `json:"device"`
}

type WiFiInterface struct {
	Device   string `json:"device"`
	State    string `json:"state"`
	SSID     string `json:"ssid"`
	Mode     string `json:"mode"`
	Channel  string `json:"chan"`
	Rate     string `json:"rate"`
	Signal   string `json:"signal"`
	Security string `json:"security"`
}

type WiFiNetwork struct {
	SSID     string `json:"ssid"`
	Mode     string `json:"mode"`
	Channel  string `json:"chan"`
	Rate     string `json:"rate"`
	Signal   string `json:"signal"`
	Security string `json:"security"`
}

type WiFiConnectResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type HotspotConnection struct {
	Connection              HotpotConnectionSettings             `json:"connection"`
	NM80211Wireless         Hotspot80211WirelessSettings         `json:"802-11-wireless"`
	NM80211WirelessSecurity Hotspot80211WirelessSecuritySettings `json:"802-11-wireless-security"`
	IPv4                    HotspotIPv4Settings                  `json:"ipv4"`
	IPv6                    HotspotIPv6Settings                  `json:"ipv6"`
}

type HotpotConnectionSettings struct {
	ID          string   `json:"id"`
	UUID        string   `json:"uuid"`
	Type        string   `json:"type"`
	AutoConnect string   `json:"autoconnect"`
	Permissions []string `json:"permissions"`
}

type Hotspot80211WirelessSettings struct {
	SSID       string `json:"ssid"`
	Mode       string `json:"mode"`
	Security   string `json:"security"`
	MACAddress string `json:"mac-address"`
}

type Hotspot80211WirelessSecuritySettings struct {
	KeyManagement string `json:"key-mgmt"`
	PSK           string `json:"psk"`
}

type HotspotIPv4Settings struct {
	Method     string   `json:"method"`
	Addressing string   `json:"addressing"`
	DNS        []string `json:"dns"`
}

type HotspotIPv6Settings struct {
	Method     string `json:"method"`
	Addressing string `json:"addressing"`
}
