package winning

import (
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

type WinningTemplateData struct {
	v2.Theme
	Customizations Win98Customizations
}

func MakeWinningTemplateData(theme v2.Theme) (WinningTemplateData, error) {
	if theme.SkinName != "winning" {
		return WinningTemplateData{}, fmt.Errorf("expected theme skin name to be 'winning' but was '%s'", theme.SkinName)
	}

	actionCenterHeight, err := parsePixelSize(theme.ActionCenterHeight)
	if err != nil {
		return WinningTemplateData{}, fmt.Errorf("failed to parse action center height '%s': %w", theme.ActionCenterHeight, err)
	}

	titleBarHeightNum := actionCenterHeight / 10

	if titleBarHeightNum <= 0 {
		return WinningTemplateData{}, fmt.Errorf("action center height / 10 must be greater than 0, but was %d", actionCenterHeight)
	}

	// Will this need some adjustment for 4k?
	if titleBarHeightNum > 50 {
		titleBarHeightNum = 50
	}

	controlHeightNum := titleBarHeightNum - 2
	controlWidthNum := controlHeightNum
	controlMinWidth := fmt.Sprintf("%dpx", controlWidthNum)
	controlMinHeight := fmt.Sprintf("%dpx", controlHeightNum)

	titleBarHeight := fmt.Sprintf("%dpx", titleBarHeightNum)
	titleBarFontSize := fmt.Sprintf("%dpx", titleBarHeightNum-(titleBarHeightNum/5))

	customizations := Win98Customizations{
		TitleBarHeight:   titleBarHeight,
		TitleBarFontSize: titleBarFontSize,
		MinimizeControl: TitleBarControl{
			BackgroundSize:     "65% 10%",
			MinHeight:          controlMinHeight,
			MinWidth:           controlMinWidth,
			BackgroundPosition: "center calc(100% - 10px)",
		},
		MaximizeControl: TitleBarControl{
			BackgroundSize:     "65% 65%",
			MinHeight:          controlMinHeight,
			MinWidth:           controlMinWidth,
			BackgroundPosition: "center center",
		},
		CloseControl: TitleBarControl{
			BackgroundSize:     "65% 65%",
			MinHeight:          controlMinHeight,
			MinWidth:           controlMinWidth,
			BackgroundPosition: "center center",
		},
	}

	return WinningTemplateData{
		Theme:          theme,
		Customizations: customizations,
	}, nil
}

func parsePixelSize(size string) (int, error) {
	var value int
	_, err := fmt.Sscanf(size, "%dpx", &value)
	if err != nil {
		return 0, fmt.Errorf("failed to parse pixel size %q: %w", size, err)
	}
	return value, nil
}

type Win98Customizations struct {
	TitleBarHeight   string
	TitleBarFontSize string
	MinimizeControl  TitleBarControl
	MaximizeControl  TitleBarControl
	CloseControl     TitleBarControl
}

type TitleBarControl struct {
	BackgroundSize     string
	MinHeight          string
	MinWidth           string
	BackgroundPosition string
}
