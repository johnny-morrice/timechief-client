package system

import (
	"fmt"
	"log"
)

func (sys System) OpenFirewall(ports []string) error {
	Lock()
	defer Unlock()

	if !sys.EnableSystemAutomation {
		log.Println("system automation disabled, not setting firewall ports")
		return nil
	}

	err := sys.doFirewall(ports)
	if err != nil {
		log.Printf("firewall error: %v", err)
	}
	return nil
}

func (sys System) doFirewall(ports []string) error {
	log.Printf("setting firewall ports open: %s", ports)
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	return sys.runScript(cfg, "timechief-firewall")
}
