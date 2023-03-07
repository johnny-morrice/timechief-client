package viewmodel

import (
	"errors"
	"testing"

	"github.com/johnny-morrice/timechief-client/client/util"
)

const UUID1 = "201c0118-66af-4deb-845f-09b87e21020b"
const UUID2 = "8efe88bb-875b-42fb-8421-38baa149250c"

const tooLongString = "TooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnftTooLong-arxioenfnehfoienwftoienwftoiewnft"

type validationTestCase[T any] struct {
	CaseName      string
	Model         T
	ExpectedError error
}

func validateCases[T any](t *testing.T, f util.ValidatorFunc[T], cases ...validationTestCase[T]) {
	t.Helper()
	for _, testCase := range cases {
		actualErr := f(testCase.Model)
		if actualErr != nil && testCase.ExpectedError == nil {
			t.Errorf("%s unexpected error: %s", testCase.CaseName, actualErr)
		} else if actualErr != nil && testCase.ExpectedError != nil && actualErr.Error() != testCase.ExpectedError.Error() {
			t.Errorf("%s expected error %s but was %s", testCase.CaseName, testCase.ExpectedError, actualErr)
		} else if actualErr == nil && testCase.ExpectedError != nil {
			t.Errorf("%s expected error %s", testCase.CaseName, testCase.ExpectedError)
		}
	}
}

func TestClockCredentialsValidation(t *testing.T) {
	validateCases(t, ValidateClockCredentials,
		validationTestCase[*ClockCredentials]{
			CaseName: "valid clock credentials",
			Model: &ClockCredentials{
				DeviceSerial: UUID1,
				DeviceSecret: UUID2,
			},
		},
		validationTestCase[*ClockCredentials]{
			CaseName: "missing clock serial",
			Model: &ClockCredentials{
				DeviceSecret: UUID2,
			},
			ExpectedError: errors.New("invalid clock serial: id missing; clock-credentials validation error"),
		},
		validationTestCase[*ClockCredentials]{
			CaseName: "missing clock secret",
			Model: &ClockCredentials{
				DeviceSerial: UUID1,
			},
			ExpectedError: errors.New("invalid clock secret: secret must be at least 8 characters; clock-credentials validation error"),
		},
		validationTestCase[*ClockCredentials]{
			CaseName: "invalid clock serial",
			Model: &ClockCredentials{
				DeviceSerial: "foo",
				DeviceSecret: UUID2,
			},
			ExpectedError: errors.New("invalid clock serial: expected v4 uuid but received: foo; clock-credentials validation error"),
		},
		validationTestCase[*ClockCredentials]{
			CaseName: "invalid clock secret",
			Model: &ClockCredentials{
				DeviceSerial: UUID1,
				DeviceSecret: tooLongString,
			},
			ExpectedError: errors.New("invalid clock secret: max secret length is 100 characters; clock-credentials validation error"),
		},
	)
}

func TestClockValidation(t *testing.T) {
	validateCases(t, ValidateClock,
		validationTestCase[*Clock]{
			CaseName: "valid clock",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
		},
		validationTestCase[*Clock]{
			CaseName: "valid clock with no principal",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
			},
		},
		validationTestCase[*Clock]{
			CaseName: "invalid clock serial",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    "foo",
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid device serial: expected v4 uuid but received: foo; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "empty clock serial",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid device serial: id missing; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid latitude",
			Model: &Clock{
				Latitude:        "foo",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid latitude: invalid decimal: can't convert foo to decimal; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid longitude",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "foo",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid longitude: invalid decimal: can't convert foo to decimal; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid timezone",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        tooLongString,
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid timezone: max short text length is 30 characters; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid location",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        tooLongString,
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid location: max short text length is 30 characters; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid hour cycle option",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: tooLongString,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: UUID2,
			},
			ExpectedError: errors.New("invalid hour cycle option: max short text length is 30 characters; clock validation error"),
		},
		validationTestCase[*Clock]{
			CaseName: "invalid principal serial",
			Model: &Clock{
				Latitude:        "10.5",
				Longitude:       "20.6",
				Timezone:        "Europe/London",
				Location:        "London",
				HourCycleOption: HCO24,
				DisplayTimezone: true,
				DeviceSerial:    UUID1,
				PrincipalSerial: "foo",
			},
			ExpectedError: errors.New("invalid principal serial: expected v4 uuid but received: foo; clock validation error"),
		},
	)
}
