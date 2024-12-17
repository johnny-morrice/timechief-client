package layout

import (
	"encoding/json"
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

// TODO implement me
func GetConfigurations() []Configuration {
	return []Configuration{
		sevenInchLayout(),
	}
}

func sevenInchLayout() Configuration {
	var theme v2.Theme
	const themeJson = `{
			"display_width": 800,
			"display_height": 480,
			"layout_type": "seven_inch",
			"widget_switcher_x": "20px",
			"widget_switcher_y": "20px",
			"widget_switcher_width": "240px",
			"widget_switcher_height": "360px",
			"date_time_x": "320px",
			"date_time_y": "20px",
			"date_time_width": "410px",
			"date_time_height": "220px",
			"action_center_x": "320px",
			"action_center_y": "260px",
			"action_center_width": "370px",
			"action_center_height": "120px",
			"planner_x": "20px",
			"planner_y": "440px",
			"planner_width": "710px",
			"planner_height": "800px",
			"body_font_size": "16pt",
			"date_font_size": "36pt",
			"time_font_size": "86pt",
			"current_weather_font_size": "18pt",
			"action_button_font_size": "18pt",
			"switcher_button_font_size": "16pt",
			"astro_font_size": "16pt",
			"weather_data_font_size": "32pt",
			"current_weather_icon_font_size": "28pt",
			"forecast_icon_font_size": "32pt",
			"forecast_table_icon_font_size": "24pt",
			"forecast_control_button_font_size": "16pt",
			"forecast_control_label_font_size": "16pt",
			"calendar_day_date_font_size": "20pt",
			"calendar_day_font_size": "14pt",
			"event_calendar_control_button_font_size": "16pt",
			"fortune_message_font_size": "14pt",
			"next_event_time_font_size": "18pt",
			"next_event_text_font_size": "16pt",
			"loading_grid_font_size": "16pt",
			"planner_date_cell_font_size": "8pt",
			"planner_date_cell_width": "70px",
			"planner_date_cell_height": "50px",
			"disabled_button_border_color": "#ffa500ff",
			"disabled_button_foreground_color": "#ffa500ff",
			"disabled_button_background_color": "#ffa500ff",
			"error_color": "#ffa500ff",
			"fortune_mascot_height": "120px",
			"event_mascot_height": "100px",
			"status_note_font_size": "16pt"
		}`
	err := json.Unmarshal([]byte(themeJson), &theme)
	if err != nil {
		panic(fmt.Sprintf("BUG in default theme: %s", err))
	}
	return Configuration{
		Name:      "default_seven_inch",
		MinHeight: -1,
		MaxHeight: -1,
		MinWidth:  -1,
		MaxWidth:  -1,
		Layout:    theme,
	}
}
