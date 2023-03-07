package viewmodel

import (
	"github.com/shopspring/decimal"
)

type ClockData struct {
	Clock           Clock
	Weather         OneCallWeather
	LinkedPrincipal ClockPrincipal
	Accounts        ClockDataAccounts
	Calendar        CalendarResponse
}

type ClockDataAccounts struct {
	Google GoogleProfileResponse
}

type OneCallWeather struct {
	Current CurrentWeather
	Daily   []DailyWeather
}

type DailyWeather struct {
	Dt                int64
	Temp              DailyTemperature
	FeelsLike         DailyTemperature
	WeatherConditions WeatherCondition
	Sunrise           int64
	Sunset            int64
	Moonrise          int64
	Moonset           int64
	MoonPhase         decimal.Decimal
}

type DailyTemperature struct {
	Morn  decimal.Decimal
	Day   decimal.Decimal
	Eve   decimal.Decimal
	Night decimal.Decimal
}

type CurrentWeather struct {
	Temp              decimal.Decimal
	FeelsLike         decimal.Decimal
	WeatherConditions WeatherCondition
}

type WeatherCondition struct {
	ConditionCode string
	Warning       bool
}
