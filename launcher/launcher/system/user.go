package system

import (
	"fmt"
	"log"
)

func (sys System) ChangeUserPassword(username, password string) error {
	if username == "" {
		return fmt.Errorf("expected username")
	}

	if len(password) < 8 {
		return fmt.Errorf("password too short")
	}

	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return fmt.Errorf("failed to get config: %w", err)
	}

	if !sys.EnableSystemAutomation {
		log.Println("system automation disabled, not changing user password")
		return nil
	}

	return sys.runScript(cfg, "timechief-ssh-change-passwd", username, password)
}
