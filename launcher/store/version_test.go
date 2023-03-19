package store_test

import (
	"errors"
	"reflect"
	"testing"

	"github.com/johnny-morrice/timechief-client/launcher/store"
)

func TestSortVersionsDecreasing(t *testing.T) {
	type testCase struct {
		versions []store.Version
		expected []store.Version
	}

	testCases := map[string]testCase{
		"empty": {
			versions: []store.Version{},
			expected: []store.Version{},
		},
		"one": {
			versions: []store.Version{
				{
					Version: "v1.0.0",
				},
			},
			expected: []store.Version{
				{
					Version: "v1.0.0",
				},
			},
		},
		"two": {
			versions: []store.Version{
				{
					Version: "v1.0.0",
				},
				{
					Version: "v2.0.0",
				},
			},
			expected: []store.Version{
				{
					Version: "v2.0.0",
				},
				{
					Version: "v1.0.0",
				},
			},
		},
		"three": {
			versions: []store.Version{
				{
					Version: "v1.0.0",
				},
				{
					Version: "v2.0.0",
				},
				{
					Version: "v3.0.0",
				},
			},
			expected: []store.Version{
				{
					Version: "v3.0.0",
				},
				{
					Version: "v2.0.0",
				},
				{
					Version: "v1.0.0",
				},
			},
		},
		"three in order": {
			versions: []store.Version{
				{
					Version: "v3.0.0",
				},
				{
					Version: "v2.0.0",
				},
				{
					Version: "v1.0.0",
				},
			},
			expected: []store.Version{
				{
					Version: "v3.0.0",
				},
				{
					Version: "v2.0.0",
				},
				{
					Version: "v1.0.0",
				},
			},
		},
	}

	for name, testCase := range testCases {
		t.Run(name, func(t *testing.T) {
			// Copy the versions slice
			cpy := make([]store.Version, len(testCase.versions))
			copy(cpy, testCase.versions)
			store.SortVersionsDecreasing(cpy)
			if !reflect.DeepEqual(cpy, testCase.expected) {
				t.Errorf("Expected %v\nactual %v", testCase.expected, cpy)
			}
		})
	}
}

func TestFindLatestVersion(t *testing.T) {
	type testCase struct {
		config        store.Config
		versions      []store.Version
		expected      store.Version
		expectedError error
	}

	testCases := map[string]testCase{
		"empty": {
			config: store.Config{
				Config: map[string]string{
					"product": "foo",
					"stream":  "bar",
				},
			},
			versions:      []store.Version{},
			expected:      store.Version{},
			expectedError: store.ErrNoVersion,
		},
		"no match product": {
			config: store.Config{
				Config: map[string]string{
					"product": "baz",
					"stream":  "bar",
				},
			},
			versions: []store.Version{
				{
					Version: "v1.0.0",
					Product: "foo",
					Stream:  "bar",
				},
			},
			expected:      store.Version{},
			expectedError: store.ErrNoVersion,
		},
		"no match stream": {
			config: store.Config{
				Config: map[string]string{
					"product": "foo",
					"stream":  "baz",
				},
			},
			versions: []store.Version{
				{
					Version: "v1.0.0",
					Product: "foo",
					Stream:  "bar",
				},
			},
			expected:      store.Version{},
			expectedError: store.ErrNoVersion,
		},
		"match": {
			config: store.Config{
				Config: map[string]string{
					"product": "foo",
					"stream":  "bar",
				},
			},
			versions: []store.Version{
				{
					Version: "v1.0.0",
					Product: "foo",
					Stream:  "bar",
				},
			},
			expected: store.Version{
				Version: "v1.0.0",
				Product: "foo",
				Stream:  "bar",
			},
			expectedError: nil,
		},
		"match latest": {
			config: store.Config{
				Config: map[string]string{
					"product": "foo",
					"stream":  "bar",
				},
			},
			versions: []store.Version{
				{
					Version: "v1.0.0",
					Product: "foo",
					Stream:  "bar",
				},
				{
					Version: "v1.0.1",
					Product: "foo",
					Stream:  "bar",
				},
			},
			expected: store.Version{
				Version: "v1.0.1",
				Product: "foo",
				Stream:  "bar",
			},
			expectedError: nil,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			actual, actualError := store.FindLatestVersion(tc.config, tc.versions)
			if !reflect.DeepEqual(actual, tc.expected) {
				t.Errorf("Expected %v\nactual %v", tc.expected, actual)
			}
			if !errors.Is(actualError, tc.expectedError) {
				t.Errorf("Expected %v\nactual %v", tc.expectedError, actualError)
			}
		})
	}
}
