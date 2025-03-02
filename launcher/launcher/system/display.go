package system

import "fmt"

type Resolution struct {
	Width  int
	Height int
}

func (sys System) GetResolution() (Resolution, error) {
	if sys.IsForceResolution {
		return sys.ForcedResolution, nil
	}

	cfg, err := sys.ConfigStore.GetConfig()
	if err != nil {
		return Resolution{}, fmt.Errorf("failed to get config: %w", err)
	}
	output, err := sys.runScriptCaptureOutput(cfg, "timechief-get-resolution")
	if err != nil {
		return Resolution{}, fmt.Errorf("failed to run resolution script: %w", err)
	}
	var res Resolution
	_, err = fmt.Sscanf(string(output), "%dx%d", &res.Width, &res.Height)
	if err != nil {
		return Resolution{}, fmt.Errorf("failed to parse resolution '%s': %w", output, err)
	}
	return res, nil
}
