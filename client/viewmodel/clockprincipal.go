package viewmodel

import (
	"github.com/johnny-morrice/timechief/util"
	"github.com/pkg/errors"
)

type ClockPrincipal struct {
	PrincipalSerial     string
	GoogleAccountLinked bool
	WantsGoogleAccount  bool
}

func ValidateClockPrincipal(principal *ClockPrincipal) error {
	return util.ValidateResource("clock-principal", principal,
		func(principal *ClockPrincipal) error {
			return errors.Wrap(util.ValidateID(principal.PrincipalSerial), "invalid principal serial")
		},
	)
}

type ClockPrincipalPage struct {
	Page
	ClockPrincipals []*ClockPrincipal
}

type ClockPrincipalRegistration struct {
	PrincipalSecret string
}

type PrincipalCredentials struct {
	PrincipalSerial string
	PrincipalSecret string
}

func ValidatePrincipalCredentials(creds *PrincipalCredentials) error {
	return util.ValidateResource("principal-credentials", creds,
		func(creds *PrincipalCredentials) error {
			return errors.Wrap(util.ValidateID(creds.PrincipalSerial), "invalid principal serial")
		},
		func(creds *PrincipalCredentials) error {
			return errors.Wrap(util.ValidateSecret(creds.PrincipalSecret), "invalid principal secret")
		},
	)
}
