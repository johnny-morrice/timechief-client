package util

import (
	"fmt"
	"net/url"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/shopspring/decimal"
	"golang.org/x/mod/semver"
)

type ValidatorFunc[T any] func(T) error

func ValidateResource[T any](resourceName string, model T, validations ...ValidatorFunc[T]) error {
	errs := []error{}
	for _, v := range validations {
		vErr := v(model)
		if vErr != nil {
			errs = append(errs, vErr)
		}

	}
	return joinValidationErrors(resourceName, errs)
}

func joinValidationErrors(resourceName string, errs []error) error {
	if len(errs) == 0 {
		return nil
	}
	err := fmt.Errorf("%s validation error", resourceName)
	errs = append(errs, err)
	return JoinErrors(errs)
}

func ValidateID(id string) error {
	const v4len = 36
	if id == "" {
		return errors.New("id missing")
	} else if len(id) != v4len {
		if len(id) > v4len {
			return fmt.Errorf("expected v4 uuid but received: %s...", id[:v4len])
		}
		return fmt.Errorf("expected v4 uuid but received: %v", id)
	}

	_, err := uuid.Parse(id)
	return errors.Wrapf(err, "invalid UUID: %s", id)
}

func ValidateShortTextList(texts []string) error {
	if len(texts) == 0 {
		return nil
	}
	errs := []error{}
	for _, t := range texts {
		tErr := ValidateShortText(t)
		if tErr != nil {
			errs = append(errs, tErr)
		}
	}

	return JoinErrors(errs)
}

func ValidateDecimalText(text string) error {
	if len(text) > 20 {
		return errors.New("decimal must be less than 20 characters long")
	}
	_, err := decimal.NewFromString(text)
	return errors.Wrap(err, "invalid decimal")
}

func ValidateSecret(secret string) error {
	if len(secret) < 8 {
		return errors.New("secret must be at least 8 characters")
	}
	if len(secret) > 100 {
		return errors.New("max secret length is 100 characters")
	}
	return nil
}

func ValidateSemver(text string) error {
	if len(text) > 50 {
		return errors.New("max semver length is 50 characters")
	}
	if !semver.IsValid(text) {
		return errors.New("invalid semver")
	}
	return nil
}

func ValidateShortText(text string) error {
	if len(text) > 30 {
		return errors.New("max short text length is 30 characters")
	}
	return nil
}

func ValidateURL(text string) error {
	_, err := url.Parse(text)
	if err != nil {
		return fmt.Errorf("invalid URL: %s; %w", text, err)
	}
	return nil
}

func ValidateSHA256Text(text string) error {
	if len(text) != 64 {
		return errors.New("invalid sha256 length")
	}
	return nil
}

func ValidateLongText(text string) error {
	if len(text) > 200 {
		return errors.New("max long text length is 100 characters")
	}
	return nil
}

func ValidateLongDataText(data string) error {
	if len(data) > 10_000 {
		return errors.New("max data length is 10,000 characters")
	}
	return nil
}

func ValidateShortDataText(data string) error {
	if len(data) > 1000 {
		return errors.New("max data length is 1000 characters")
	}
	return nil
}

func ValidateNotEmpty(text string) error {
	if text == "" {
		return errors.New("missing mandatory parameter")
	}

	return nil
}
