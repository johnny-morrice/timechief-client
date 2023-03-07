package viewmodel

import (
	"github.com/johnny-morrice/timechief-client/client/util"
	"github.com/pkg/errors"
)

type HourCycleOption string

const (
	HCO24 = "24h"
	HCO12 = "12h"
)

func AllHourCycleOptions() []HourCycleOption {
	return []HourCycleOption{HCO24, HCO12, ""}
}

type Clock struct {
	Latitude        string `json:",omitempty" faker:"decimalString"`
	Longitude       string `json:",omitempty" faker:"decimalString"`
	Timezone        string `json:",omitempty"`
	Location        string `json:",omitempty"`
	Locale          string `json:",omitempty"`
	HourCycleOption HourCycleOption
	DisplayTimezone bool
	DeviceSerial    string
	PrincipalSerial string `faker:"-"`
}

func ValidateClock(clock *Clock) error {
	return util.ValidateResource("clock", clock,
		func(clock *Clock) error {
			if clock.Latitude == "" {
				return nil
			}
			return errors.Wrap(util.ValidateDecimalText(clock.Latitude), "invalid latitude")
		},
		func(clock *Clock) error {
			if clock.Longitude == "" {
				return nil
			}
			return errors.Wrap(util.ValidateDecimalText(clock.Longitude), "invalid longitude")
		},
		func(clock *Clock) error {
			return errors.Wrap(util.ValidateShortText(clock.Timezone), "invalid timezone")
		},
		func(clock *Clock) error {
			return errors.Wrap(util.ValidateShortText(clock.Location), "invalid location")
		},
		func(clock *Clock) error {
			return errors.Wrap(util.ValidateShortText(string(clock.HourCycleOption)), "invalid hour cycle option")
		},
		func(clock *Clock) error {
			return errors.Wrap(util.ValidateID(clock.DeviceSerial), "invalid device serial")
		},
		func(clock *Clock) error {
			if clock.PrincipalSerial == "" {
				return nil
			}
			return errors.Wrap(util.ValidateID(clock.PrincipalSerial), "invalid principal serial")
		},
	)
}

type ClockPage struct {
	Page
	Clocks []*Clock
}

type ClockCredentials struct {
	DeviceSerial string
	DeviceSecret string
}

func ValidateClockCredentials(creds *ClockCredentials) error {
	return util.ValidateResource("clock-credentials", creds,
		func(creds *ClockCredentials) error {
			return errors.Wrap(util.ValidateID(creds.DeviceSerial), "invalid clock serial")
		},
		func(creds *ClockCredentials) error {
			return errors.Wrap(util.ValidateSecret(creds.DeviceSecret), "invalid clock secret")
		},
	)
}
