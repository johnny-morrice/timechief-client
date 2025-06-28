package winning

import (
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

type WinningTemplateData struct {
	Theme          v2.Theme
	Customizations Win98Customizations
}

func MakeWinningTemplateDat(theme v2.Theme) (WinningTemplateData, error) {
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

	controlHeightNum := titleBarHeightNum - 2
	controlWidthNum := controlHeightNum
	controlMinWidth := fmt.Sprintf("%dpx", controlWidthNum)
	controlMinHeight := fmt.Sprintf("%dpx", controlHeightNum)

	titleBarHeight := fmt.Sprintf("%dpx", actionCenterHeight/10)

	customizations := Win98Customizations{
		TitleBarHeight: titleBarHeight,
		MinimizeControl: TitleBarControl{
			BackgroundImage: minimizeControlBackgroundImage,
			BackgroundSize:  "65% 65%",
			MinHeight:       controlMinHeight,
			MinWidth:        controlMinWidth,
		},
		MaximizeControl: TitleBarControl{
			BackgroundImage: maximizeControlBackgroundImage,
			BackgroundSize:  "65% 65%",
			MinHeight:       controlMinHeight,
			MinWidth:        controlMinWidth,
		},
		CloseControl: TitleBarControl{
			BackgroundImage: closeControlBackgroundImage,
			BackgroundSize:  "65% 65%",
			MinHeight:       controlMinHeight,
			MinWidth:        controlMinWidth,
		},
	}

	return WinningTemplateData{
		Theme:          theme,
		Customizations: customizations,
	}, nil
}

const minimizeControlBackgroundImage = ""
const maximizeControlBackgroundImage = ""
const closeControlBackgroundImage = ""

func parsePixelSize(size string) (int, error) {
	var value int
	_, err := fmt.Sscanf(size, "%dpx", &value)
	if err != nil {
		return 0, fmt.Errorf("failed to parse pixel size %q: %w", size, err)
	}
	return value, nil
}

type Win98Customizations struct {
	TitleBarHeight  string
	MinimizeControl TitleBarControl
	MaximizeControl TitleBarControl
	CloseControl    TitleBarControl
}

type TitleBarControl struct {
	BackgroundImage string
	BackgroundSize  string
	MinHeight       string
	MinWidth        string
}
