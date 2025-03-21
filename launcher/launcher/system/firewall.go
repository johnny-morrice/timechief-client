package system

import (
	"fmt"
	"log"
	"strings"
)

func (sys System) RunCaptivePortal(ports []string) error {
	Lock()
	defer Unlock()

	if !sys.EnableSystemAutomation {
		log.Println("system automation disabled, not setting captive portal")
		return nil
	}

	storeIFace, err := sys.WifiInterfaceStore.GetActive()
	if err != nil {
		return fmt.Errorf("failed to get active wifi card: %w", err)
	}

	err = sys.doFirewall(storeIFace.Interface, ports)
	if err != nil {
		log.Printf("captive portal error: %v", err)
	}
	return nil
}

func (sys System) OpenFirewall(ports []string) error {
	Lock()
	defer Unlock()

	if !sys.EnableSystemAutomation {
		log.Println("system automation disabled, not setting firewall ports")
		return nil
	}

	err := sys.doFirewall("", ports)
	if err != nil {
		log.Printf("firewall error: %v", err)
	}
	return nil
}

func (sys System) doFirewall(captiveIface string, ports []string) error {
	log.Printf("setting firewall ports open: %s", ports)
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	portArg := strings.Join(ports, ",")
	args := []string{}
	if len(captiveIface) != 0 {
		args = append(args, "--captive", captiveIface)
	}

	if len(portArg) != 0 {
		args = append(args, portArg)
	}

	return sys.runScript(cfg, "timechief-firewall", args...)
}
