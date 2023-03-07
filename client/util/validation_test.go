package util

import (
	"testing"

	"github.com/google/uuid"
)

func TestValidateIDOnRandomUUIDs(t *testing.T) {
	for i := 0; i < 10_000; i++ {
		id := uuid.NewString()
		err := ValidateID(id)
		if err != nil {
			t.Fatalf("unexpected validation error: %s", err)
			return
		}
	}

}

func TestValidateSemver(t *testing.T) {
	validSemver := []string{
		"v1.0.0",
		"v1.0.0-alpha",
		"v1.0.0-alpha.1",
		"v1.0.0-alpha.1.1",
		"v1.0.0-alpha+1",
		"v1.0.0-alpha.1+1",
		"v1.0.0-alpha.1.1+1",
		"v1.0.0+1",
		"v1.0.0+1.1",
		"v1.0.0+1.1.1",
	}
	invalidSemver := []string{
		"!!!",
		"v1.0.!!",
		"1.0.0-alpha+1.1.1",
	}
	for _, semver := range validSemver {
		t.Run(semver, func(t *testing.T) {
			err := ValidateSemver(semver)
			if err != nil {
				t.Fatalf("unexpected validation error: %s", err)
				return
			}
		})
	}
	for _, semver := range invalidSemver {
		t.Run(semver, func(t *testing.T) {
			err := ValidateSemver(semver)
			if err == nil {
				t.Fatalf("expected validation error")
				return
			}
		})
	}
}

func TestValidateURL(t *testing.T) {
	validURL := []string{
		"https://example.com",
		"https://example.com/",
		"https://example.com/path",
		"https://example.com/path/",
		"https://example.com/path?query=1",
		"https://example.com/path?query=1&query=2",
		"https://example.com/path?query=1&query=2#fragment",
		"https://example.com/path?query=1&query=2#fragment/",
		"https://example.org/1.0.0",
	}
	invalidURL := []string{
		"%20://example.com",
		"https://[fe80::1",
	}
	for _, url := range validURL {
		t.Run(url, func(t *testing.T) {
			err := ValidateURL(url)
			if err != nil {
				t.Fatalf("unexpected validation error: %s", err)
				return
			}
		})
	}
	for _, url := range invalidURL {
		t.Run(url, func(t *testing.T) {
			err := ValidateURL(url)
			if err == nil {
				t.Fatalf("expected validation error")
				return
			}
		})
	}
}
