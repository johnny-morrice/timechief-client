package util

import (
	"testing"

	"github.com/google/go-cmp/cmp"
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

func assertEqual(t *testing.T, expected interface{}, actual interface{}) {
	t.Helper()
	diff := cmp.Diff(expected, actual)
	if diff != "" {
		t.Logf("expected %v but received %v", expected, actual)
		t.Fatal(diff)
	}
}
