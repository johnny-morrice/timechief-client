package netcmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strings"
)

type NetCmd struct {
	BasePath string
}

func (nc NetCmd) scriptPath(scriptName string) string {
	return filepath.Join(nc.BasePath, scriptName)
}

func (nc NetCmd) Scan(ifname string) ([]WiFiNetwork, error) {
	// nmcli -g json device wifi rescan ifname <interface>
	result := []WiFiNetwork{}
	err := parseExecute(&result, nc.scriptPath("timechief-wifi-scan"), ifname)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (nc NetCmd) ReadWifiInterfaces() ([]WiFiInterface, error) {
	// nmcli -g json device wifi list
	result := []WiFiInterface{}
	err := parseExecute(&result, nc.scriptPath("timechief-wifi-interfaces"))
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (nc NetCmd) ConnectToWifi(ssid, password, ifname string) (NetResult, error) {
	// nmcli -g json device wifi connect <SSID> password <password> ifname <interface>
	result := NetResult{}
	err := parseExecute(&result, nc.scriptPath("timechief-wifi-connect"), ssid, password, ifname)
	if err != nil {
		return NetResult{}, err
	}
	return result, nil
}

func (nc NetCmd) Hotspot(ssid, password, ifname string) (NetResult, error) {
	// nmcli device wifi hotspot ssid <SSID> password <password> ifname <interface>
	result := NetResult{}
	err := parseExecute(&result, nc.scriptPath("timechief-wifi-hotspot"), ssid, password, ifname)
	if err != nil {
		return NetResult{}, err
	}
	return result, nil
}

func (nc NetCmd) ReadWifiInterface(ifname string) (WiFiInterface, error) {
	// nmcli -g json device show <interface>
	result := WiFiInterface{}
	err := parseExecute(&result, nc.scriptPath("timechief-wifi-interface"), ifname)
	if err != nil {
		return WiFiInterface{}, err
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
	Device      string
	State       string
	SSID        string
	Mode        string
	IPV4Address string
}

type WiFiNetwork struct {
	SSID     string
	Mode     string
	Signal   string
	Security string
}

type NetResult struct {
	Success bool
	Message string
}
