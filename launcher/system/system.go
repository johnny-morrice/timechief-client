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
	DB  *gorm.DB
	Cfg store.Config
}

func (sys System) stopApp() error {
	return store.CloseDB(sys.DB)
}

func (sys System) runScript(path string) error {
	root := sys.Cfg.GetInstallRoot()
	script := filepath.Join(root, path)
	output, err := exec.Command(script).CombinedOutput()
	log.Printf("system script %s output: %s", script, output)
	if err != nil {
		return fmt.Errorf("failed to execute system script %s: %w", path, err)
	}
	return nil
}

func (sys System) doShutdown() error {
	err := sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runScript("bin/timechief-shutdown")
}

func (sys System) doReboot() error {
	err := sys.stopApp()
	if err != nil {
		return err
	}
	return sys.runScript("bin/timechief-reboot")
}

func (sys System) Shutdown() error {
	err := sys.doShutdown()
	if err != nil {
		log.Printf("shutdown error: %v", err)
	}
	return nil
}

func (sys System) Reboot() error {
	err := sys.doReboot()
	if err != nil {
		log.Printf("reboot error: %v", err)
	}
	return nil
}
