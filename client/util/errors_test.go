package util

import (
	"testing"

	"github.com/pkg/errors"
)

func TestJoinErrorsWhenNoError(t *testing.T) {
	assertIsNil(t, JoinErrors([]error{}))
	assertIsNil(t, JoinErrors(nil))
}

func TestJoinErrorsWhenOneError(t *testing.T) {
	err := JoinErrors([]error{errors.New("foo")})
	assertEqual(t, "foo", err.Error())
}

func TestJoinErrorsWhenTwoErrors(t *testing.T) {
	err := JoinErrors([]error{errors.New("foo"), errors.New("bar")})
	assertEqual(t, "foo; bar", err.Error())
}

func assertIsNil(t *testing.T, value interface{}) {
	t.Helper()
	if value != nil {
		t.Errorf("expected nil but received: %v", value)
	}
}
