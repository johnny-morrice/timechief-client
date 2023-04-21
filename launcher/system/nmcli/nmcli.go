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
