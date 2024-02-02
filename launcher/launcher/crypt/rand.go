package crypt

import (
	"crypto/rand"
)

// GenerateRandomAPIKey generates a secure random API key using the golang crypto/rand package.
func GenerateRandomAPIKey() (string, error) {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	const length = 16
	bytes, err := generateRandomBytes(length)
	if err != nil {
		return "", err
	}
	out := make([]byte, length)
	for i, b := range bytes {
		out[i] = chars[b%byte(len(chars))]
	}
	return string(out), nil
}

// generateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random
// number generator fails to function correctly, in which
// case the caller should not continue.
func generateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	// Note that err == nil only if we read len(b) bytes.
	if err != nil {
		return nil, err
	}

	return b, nil
}
