package netcmd

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type NetCmd struct {
	BasePath string
}

func NewNetCmd(cfg store.Config) NetCmd {
	root := filepath.Join(cfg.GetInstallRoot(), "bin")
	return NetCmd{
		BasePath: root,
	}
}

func (nc NetCmd) scriptPath(scriptName string) string {
	return filepath.Join(nc.BasePath, scriptName)
}

func (nc NetCmd) ConnectToWifi(ssid, password, ifname string) error {
	return nc.logExecute(nc.scriptPath("timechief-wifi-connect"), ssid, password, ifname)
}

func (nc NetCmd) Hotspot(ssid, password, ifname, accessPointIP string) error {
	return nc.logExecute(nc.scriptPath("timechief-wifi-hotspot"), ssid, password, ifname, accessPointIP)
}

func (nc NetCmd) ReadWifiInterface(ifname string) (WiFiInterface, error) {
	// nmcli device show <interface>
	result := WiFiInterface{}
	err := nc.parseExecute(&result, nc.scriptPath("timechief-wifi-interface"), ifname)
	if err != nil {
		return WiFiInterface{}, err
	}
	return result, nil
}

func (nc NetCmd) ReadWifiInterfaces() ([]WiFiInterface, error) {
	// nmcli device wifi list
	result := []WiFiInterface{}
	err := nc.parseExecute(&result, nc.scriptPath("timechief-wifi-interfaces"))
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (nc NetCmd) Scan(ifname string) ([]WiFiNetwork, error) {
	// nmcli device wifi rescan ifname <interface>
	result := []WiFiNetwork{}
	err := nc.parseExecute(&result, nc.scriptPath("timechief-wifi-scan"), ifname)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (nc NetCmd) CheckInternet(address string) error {
	const debug = false
	msg, err := nc.executeReturningCombinedOutput(nc.scriptPath("timechief-internet-check"), address)
	if debug {
		log.Printf("timechief-internet-check %s: %s", address, msg)
	}
	return err
}

func (nc NetCmd) parseExecute(out interface{}, command string, args ...string) error {
	bs, err := nc.executeReturningStdout(command, args...)
	if err != nil {
		return err
	}
	err = json.Unmarshal(bs, out)
	if err != nil {
		return fmt.Errorf("failed to parse output of %s %s: %w", command, strings.Join(args, " "), err)
	}
	return nil
}

func (nc NetCmd) logExecute(command string, args ...string) error {
	msg, err := nc.executeReturningCombinedOutput(command, args...)
	if err != nil {
		return err
	}
	if len(msg) > 0 {
		log.Printf("%s %s: %s", command, strings.Join(args, " "), msg)
	}
	return nil
}

func (nc NetCmd) executeReturningCombinedOutput(command string, args ...string) ([]byte, error) {
	args = append([]string{command}, args...)
	cmd := exec.Cmd{
		Path: command,
		Args: args,
		Dir:  nc.BasePath,
	}
	bs, err := cmd.CombinedOutput()
	if err != nil {
		return bs, fmt.Errorf("failed to execute %s: %w", strings.Join(args, " "), err)
	}

	return bs, nil
}

// executeReturningStdout uses os.exec to executeReturningStdout a command.
func (nc NetCmd) executeReturningStdout(command string, args ...string) ([]byte, error) {
	stderrBuf := bytes.Buffer{}
	stdoutBuf := bytes.Buffer{}
	args = append([]string{command}, args...)
	cmd := exec.Cmd{
		Path:   command,
		Args:   args,
		Dir:    nc.BasePath,
		Stderr: &stderrBuf,
		Stdout: &stdoutBuf,
	}
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to execute %s: %w", strings.Join(args, " "), err)
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
	Signal   int
	Security []string
}

func allowedWifiSecurity() []string {
	return []string{"WPA3", "WPA2"}
}

func (wn WiFiNetwork) Validate() error {
	isAllowed := false
	for _, allowed := range allowedWifiSecurity() {
		for _, mySecurity := range wn.Security {
			if mySecurity == allowed {
				isAllowed = true
				break
			}
		}
	}
	if !isAllowed {
		return fmt.Errorf("unsupported security: %s", wn.Security)
	}

	if len(wn.SSID) < 2 || len(wn.SSID) > 32 {
		return fmt.Errorf("invalid SSID: %s", wn.SSID)
	}

	return nil
}

func (wn WiFiNetwork) SecureProtocol() (string, error) {
	for _, allowed := range allowedWifiSecurity() {
		for _, mySecurity := range wn.Security {
			if mySecurity == allowed {
				return mySecurity, nil
			}
		}
	}
	return "", errors.New("no secure protocol found")
}

type NetResult struct {
	Success bool
	Message string
}
