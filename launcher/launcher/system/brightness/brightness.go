package brightness

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// backlightPath is the base directory for backlight device files in the Linux file system.
const backlightPath = "/sys/class/backlight"

// FindBacklightIDs finds and returns all backlight IDs (subdirectories under backlightPath).
func FindBacklightIDs() ([]string, error) {
	// Open the backlight directory
	dir, err := os.Open(backlightPath)
	if err != nil {
		return nil, fmt.Errorf("could not open backlight directory %s: %w", backlightPath, err)
	}
	defer dir.Close()

	// Read directory entries
	entries, err := dir.Readdir(-1)
	if err != nil {
		return nil, fmt.Errorf("could not read entries in backlight directory %s: %w", backlightPath, err)
	}

	var ids []string
	for _, entry := range entries {
		// Try to resolve symlink if it's a symbolic link
		entryPath := filepath.Join(backlightPath, entry.Name())
		resolvedPath, err := filepath.EvalSymlinks(entryPath)
		if err != nil {
			return nil, fmt.Errorf("could not resolve symlink %s: %w", entryPath, err)
		}

		// Check if the resolved path is a directory and add its ID
		info, err := os.Stat(resolvedPath)
		if err != nil {
			return nil, fmt.Errorf("could not stat resolved path %s: %w", resolvedPath, err)
		}

		if info.IsDir() {
			ids = append(ids, entry.Name())
		}
	}

	// Check if we found any backlight devices
	if len(ids) == 0 {
		return nil, fmt.Errorf("no backlight devices found in %s; check if your hardware supports backlight controls", backlightPath)
	}

	return ids, nil
}

// SetBrightness sets the brightness of a specified backlight ID based on a given ratio.
// The ratio should be a float64 value between 0 and 1.
func SetBrightness(id string, ratio float64) error {
	if ratio < 0 || ratio > 1 {
		return fmt.Errorf("invalid ratio: %v, must be between 0 and 1", ratio)
	}

	maxBrightnessPath := filepath.Join(backlightPath, id, "max_brightness")
	brightnessPath := filepath.Join(backlightPath, id, "brightness")

	// Read max brightness
	maxBrightness, err := readMaxBrightness(maxBrightnessPath)
	if err != nil {
		return fmt.Errorf("failed to read max brightness for %s: %w", id, err)
	}

	// Calculate desired brightness based on ratio
	desiredBrightness := int(float64(maxBrightness) * ratio)

	// Write desired brightness
	if err := writeBrightness(brightnessPath, desiredBrightness); err != nil {
		return fmt.Errorf("failed to set brightness for %s: %w", id, err)
	}

	return nil
}

// readMaxBrightness reads and returns the max brightness from the specified path.
func readMaxBrightness(path string) (int, error) {
	resolvedPath, err := filepath.EvalSymlinks(path)
	if err != nil {
		return 0, fmt.Errorf("could not resolve symlink %s: %w", path, err)
	}

	data, err := os.ReadFile(resolvedPath)
	if err != nil {
		return 0, fmt.Errorf("failed to read max brightness file %s: %w", path, err)
	}

	brightnessStr := strings.TrimSpace(string(data))
	maxBrightness, err := strconv.Atoi(brightnessStr)
	if err != nil {
		return 0, fmt.Errorf("invalid max brightness value %q in file %s: %w", brightnessStr, path, err)
	}

	return maxBrightness, nil
}

// writeBrightness writes the desired brightness to the specified path.
func writeBrightness(path string, brightness int) error {
	resolvedPath, err := filepath.EvalSymlinks(path)
	if err != nil {
		return fmt.Errorf("could not resolve symlink %s: %w", path, err)
	}

	file, err := os.OpenFile(resolvedPath, os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open brightness file %s: %w", path, err)
	}
	defer file.Close()

	if _, err := file.WriteString(strconv.Itoa(brightness)); err != nil {
		return fmt.Errorf("failed to write brightness to %s: %w", path, err)
	}

	return nil
}
