package media

import (
	"math/rand"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

// randomTheme returns a random theme and is intended for testing.
func randomTheme() v2.Theme {
	i := randomColorIndex()
	bg := backgroundColor(i)
	boxBg := boxBackgroundColor(i)
	buttonBg := buttonBackgroundColor(i)
	fg := foregroundColor(i)
	radius := randomBoxRadius()
	borderWidth := boxBorderWidth()
	timeFont := "Seven Segment"
	mainFont := randomFont()
	return v2.Theme{
		ForegroundColor:       fg,
		BackgroundColor:       bg,
		BoxBackgroundColor:    boxBg,
		ButtonBackgroundColor: buttonBg,
		BoxBorderRadius:       radius,
		BoxBorderWidth:        borderWidth,
		BoxBorderColor:        fg,
		ButtonBorderRadius:    radius,
		ButtonBorderWidth:     borderWidth,
		ButtonBorderColor:     fg,
		ButtonForegroundColor: fg,
		TimeFont:              timeFont,
		TimeColor:             fg,
		MainFont:              mainFont,
	}
}

func synthwaveDemoTheme() v2.Theme {
	fgColor := "#fd49c7"
	bgColor := "#000000"
	boxBgColor := "#3d215355"
	borderRadius := "5px"
	timeColor := "#ffff84"
	timeFont := "Seven Segment"
	mainFont := "'Titillium Web'"
	borderWidth := "1px"
	return v2.Theme{
		ForegroundColor:       fgColor,
		BackgroundColor:       bgColor,
		BoxBackgroundColor:    boxBgColor,
		ButtonBackgroundColor: boxBgColor,
		BoxBorderRadius:       borderRadius,
		BoxBorderWidth:        borderWidth,
		BoxBorderColor:        boxBgColor,
		ButtonBorderRadius:    borderRadius,
		ButtonBorderWidth:     borderWidth,
		ButtonBorderColor:     boxBgColor,
		ButtonForegroundColor: fgColor,
		TimeFont:              timeFont,
		TimeColor:             timeColor,
		MainFont:              mainFont,
	}
}

func defaultTheme() v2.Theme {
	fgColor := "#008000"
	bgColor := "#000000"
	borderRadius := "0px"
	timeFont := "Seven Segment"
	mainFont := "'Titillium Web'"
	borderWidth := "1px"
	return v2.Theme{
		ForegroundColor:       fgColor,
		BackgroundColor:       bgColor,
		BoxBackgroundColor:    bgColor,
		ButtonBackgroundColor: bgColor,
		BoxBorderRadius:       borderRadius,
		BoxBorderWidth:        borderWidth,
		BoxBorderColor:        fgColor,
		ButtonBorderRadius:    borderRadius,
		ButtonBorderWidth:     borderWidth,
		ButtonBorderColor:     fgColor,
		ButtonForegroundColor: fgColor,
		TimeFont:              timeFont,
		TimeColor:             fgColor,
		MainFont:              mainFont,
		ImageFit:              "none",

		LayoutType:           "seven_inch",
		DisplayWidth:         800,
		DisplayHeight:        480,
		WidgetSwitcherX:      "20px",
		WidgetSwitcherY:      "20px",
		WidgetSwitcherWidth:  "260px",
		WidgetSwitcherHeight: "380px",
		DateTimeX:            "340px",
		DateTimeY:            "20px",
		DateTimeWidth:        "440px",
		DateTimeHeight:       "200px",
		ActionCenterX:        "350px",
		ActionCenterY:        "260px",
		ActionCenterWidth:    "380px",
		ActionCenterHeight:   "140px",
		PlannerX:             "20px",
		PlannerY:             "480px",
		PlannerWidth:         "440px",
		PlannerHeight:        "800px",

		BodyFontSize:                       "16pt",
		DateFontSize:                       "36pt",
		TimeFontSize:                       "98pt",
		CurrentWeatherFontSize:             "18pt",
		ActionButtonFontSize:               "18pt",
		SwitcherButtonFontSize:             "16pt",
		AstroFontSize:                      "16pt",
		WeatherDataFontSize:                "32pt",
		CurrentWeatherIconFontSize:         "28pt",
		ForecastIconFontSize:               "32pt",
		ForecastWeatherTableIconFontSize:   "24pt",
		ForecastControlButtonFontSize:      "16pt",
		ForecastControlLabelFontSize:       "16pt",
		CalendarDayDateFontSize:            "20pt",
		CalendarDayFontSize:                "14pt",
		EventCalendarControlButtonFontSize: "16pt",
		FortuneMessageFontSize:             "14pt",
		NextEventTimeFontSize:              "18pt",
		NextEventTextFontSize:              "16pt",
		LoadingGridFontSize:                "16pt",
	}
}

func randomFont() string {
	return randomChoice("Titillium Web", "sans-serif", "serif", "monospace", "cursive")
}

func boxBorderWidth() string {
	return randomChoice("1px", "2px", "3px", "4px")
}

func randomBoxRadius() string {
	return randomChoice("0", "5px", "10px", "15px")
}

var colorThemes = [][]string{
	{"#648767", "#7DC95E", "#CEE7E6"},
	{"#5C6B73", "#9DB4C0", "#E0FBFC"},
	{"#1B2021", "#A6A867", "#E3DCC2"},
	{"#001D4A", "#006992", "#EAF8BF"},
}

func randomColorIndex() int {
	return rand.Int() % len(colorThemes)
}

func foregroundColor(i int) string {
	return colorThemes[i][2]
}

func backgroundColor(i int) string {
	return colorThemes[i][0]
}

func boxBackgroundColor(i int) string {
	return colorThemes[i][1]
}

func buttonBackgroundColor(i int) string {
	return colorThemes[i][1]
}

func randomChoice[T any](choices ...T) T {
	index := rand.Int() % len(choices)
	return choices[index]
}
