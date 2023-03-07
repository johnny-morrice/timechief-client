package viewmodel

import (
	"errors"
	"testing"
)

func TestPrincipalCredentialsValidation(t *testing.T) {
	validateCases(t, ValidatePrincipalCredentials,
		validationTestCase[*PrincipalCredentials]{
			CaseName: "valid principal credentials",
			Model: &PrincipalCredentials{
				PrincipalSerial: UUID1,
				PrincipalSecret: UUID2,
			},
		},
		validationTestCase[*PrincipalCredentials]{
			CaseName: "missing principal serial",
			Model: &PrincipalCredentials{
				PrincipalSecret: UUID2,
			},
			ExpectedError: errors.New("invalid principal serial: id missing; principal-credentials validation error"),
		},
		validationTestCase[*PrincipalCredentials]{
			CaseName: "missing principal secret",
			Model: &PrincipalCredentials{
				PrincipalSerial: UUID1,
			},
			ExpectedError: errors.New("invalid principal secret: secret must be at least 8 characters; principal-credentials validation error"),
		},
		validationTestCase[*PrincipalCredentials]{
			CaseName: "invalid principal serial",
			Model: &PrincipalCredentials{
				PrincipalSerial: "foo",
				PrincipalSecret: UUID2,
			},
			ExpectedError: errors.New("invalid principal serial: expected v4 uuid but received: foo; principal-credentials validation error"),
		},
		validationTestCase[*PrincipalCredentials]{
			CaseName: "invalid principal secret",
			Model: &PrincipalCredentials{
				PrincipalSerial: UUID1,
				PrincipalSecret: tooLongString,
			},
			ExpectedError: errors.New("invalid principal secret: max secret length is 100 characters; principal-credentials validation error"),
		},
	)
}

func TestPrincipalValidation(t *testing.T) {
	validateCases(t, ValidateClockPrincipal,
		validationTestCase[*ClockPrincipal]{
			CaseName: "valid principal",
			Model: &ClockPrincipal{
				PrincipalSerial: UUID2,
			},
		},
		validationTestCase[*ClockPrincipal]{
			CaseName: "invalid principal serial",
			Model: &ClockPrincipal{
				PrincipalSerial: "foo",
			},
			ExpectedError: errors.New("invalid principal serial: expected v4 uuid but received: foo; clock-principal validation error"),
		},
	)
}
