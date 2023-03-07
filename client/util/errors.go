package util

import (
	"strings"

	"github.com/pkg/errors"
)

var ErrInvalidInput = errors.New("invalid input")
var ErrInvalidState = errors.New("invalid state")
var ErrAuthenticationFailure = errors.New("authentication failure")
var ErrInvalidAuthentication = errors.New("invalid authentication request")

func InvalidStateError(message string) error {
	return errors.Wrapf(ErrInvalidState, message)
}

func InvalidInputErrorf(message string, arguments ...interface{}) error {
	return errors.Wrapf(ErrInvalidInput, message, arguments...)
}

func InvalidInputError(message string) error {
	return errors.Wrap(ErrInvalidInput, message)
}

func AuthenticationFailureError(message string) error {
	return errors.Wrap(ErrAuthenticationFailure, message)
}

func InvalidAuthenticationError(message string) error {
	return errors.Wrap(ErrInvalidAuthentication, message)
}

func JoinErrors(errs []error) error {
	if len(errs) == 0 {
		return nil
	} else if len(errs) == 1 {
		return errs[0]
	}
	builder := &strings.Builder{}
	builder.Grow(len(errs) * 5)
	for i, e := range errs {
		if i > 0 {
			builder.WriteString("; ")
		}
		builder.WriteString(e.Error())
	}
	return errors.New(builder.String())
}
