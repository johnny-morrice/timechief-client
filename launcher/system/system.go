package system

import (
	"fmt"
	"log"
	"os/exec"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/store"
	"gorm.io/gorm"
)

type System struct {
	DB          *gorm.DB
	ConfigStore store.ConfigStore
}

func (sys System) stopApp() error {
	return store.CloseDB(sys.DB)
}

func (sys System) runScript(cfg store.Config, path string) error {
	root := cfg.GetInstallRoot()
	script := filepath.Join(root, path)
	output, err := exec.Command(script).CombinedOutput()
	log.Printf("system script %s output: %s", script, output)
	if err != nil {
		return fmt.Errorf("failed to execute system script %s: %w", path, err)
	}
	return nil
}

func (sys System) doShutdown() error {
	log.Printf("shutting down")
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	err = sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runScript(cfg, "bin/timechief-shutdown")
}

func (sys System) doReboot() error {
	log.Printf("rebooting")
	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}
	err = sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runScript(cfg, "bin/timechief-reboot")
}

func (sys System) Shutdown() error {
	Lock()
	defer Unlock()
	err := sys.doShutdown()
	if err != nil {
		log.Printf("shutdown error: %v", err)
	}
	return nil
}

func (sys System) Reboot() error {
	Lock()
	defer Unlock()
	err := sys.doReboot()
	if err != nil {
		log.Printf("reboot error: %v", err)
	}
	return nil
}

func (sys System) GetWifiNetworks() ([]WifiNetwork, error) {
	panic("not implemented")
}

type WifiNetwork struct {
	ESSID string
	BSSID string
}
