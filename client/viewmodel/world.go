package viewmodel

type GeocodeResult struct {
	Lat      string
	Lng      string
	Timezone TzInfo
	Address  string
	Location string
	Culture  CultureInfo
}

type CultureInfo struct {
	CountryCode   string
	DefaultLocale string
}

type LocaleList struct {
	Locales []string
}

type LocaleInfo struct {
	Locale string
}

type TzInfo struct {
	Tz string
}

type TzInfoList struct {
	TimeZones []TzInfo
}
