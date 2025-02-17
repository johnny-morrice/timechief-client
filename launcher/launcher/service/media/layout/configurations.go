package layout

import v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"

// TODO implement me
func GetConfigurations() []Configuration {
	return []Configuration{
		sevenInchLayout(),
	}
}

func sevenInchLayout() Configuration {
	return Configuration{
		Name:      "default_seven_inch",
		MinHeight: -1,
		MaxHeight: -1,
		MinWidth:  -1,
		MaxWidth:  -1,
		Layout:    DefaultSevenInchTheme(),
	}
}

func DefaultSevenInchTheme() v2.Theme {
	fgColor := "#008000ff"
	bgColor := "#000000ff"
	errorColor := "#ffa500ff"
	borderRadius := "0px"
	timeFont := "Seven Segment"
	mainFont := "'Titillium Web'"
	borderWidth := "1px"
	return v2.Theme{
		ForegroundColor: fgColor,
		BackgroundColor: bgColor,

		BoxBackgroundColor: bgColor,
		BoxBorderRadius:    borderRadius,
		BoxBorderWidth:     borderWidth,
		BoxBorderColor:     fgColor,

		MainFont:  mainFont,
		TimeFont:  timeFont,
		TimeColor: fgColor,

		ButtonBorderRadius:    borderRadius,
		ButtonBorderWidth:     borderWidth,
		ButtonBorderColor:     fgColor,
		ButtonForegroundColor: fgColor,
		ButtonBackgroundColor: bgColor,

		DisabledButtonBorderColor:     errorColor,
		DisabledButtonForegroundColor: errorColor,
		DisabledButtonBackgroundColor: bgColor,

		ErrorColor: errorColor,

		ImageFit: "none",

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
		DateTimeHeight:       "210px",
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
		TimeFontSize:                       "102pt",
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
		FortuneMascotHeight:                "120px",
		EventMascotHeight:                  "100px",
		MascotType:                         "dark",
		StatusNoteFontSize:                 "16pt",

		PlannerDayEventCount: 0,
	}
}
