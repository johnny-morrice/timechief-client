package cmd

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/system/brightness"
	"github.com/urfave/cli/v2"
)

// Sets all display backlight brightness to a fraction of their normal.
func Brightness(ctx *cli.Context) error {
	ratio := ctx.Float64("brightness-ratio")
	if ratio < 0 || ratio > 1 {
		return fmt.Errorf("invalid brightness ratio: %f", ratio)
	}
	backlightIDs, err := brightness.FindBacklightIDs()
	if err != nil {
		return err
	}
	for _, backlight := range backlightIDs {
		brightness.SetBrightness(backlight, ratio)
	}
	return nil
}
