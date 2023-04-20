package service

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/johnny-morrice/timechief-client/launcher/store"
)

type Version struct {
	UUID    string
	Version string
	Product string
	Stream  string
	URL     string
	SHA256  []byte
	Command string
}

func VersionFromStore(storeVersion store.Version) Version {
	return Version{
		UUID:    storeVersion.UUID,
		Version: storeVersion.Version,
		Product: storeVersion.Product,
		Stream:  storeVersion.Stream,
		URL:     storeVersion.URL,
		SHA256:  storeVersion.SHA256,
		Command: storeVersion.Command,
	}
}

func (v Version) Details() string {
	return fmt.Sprintf("%s %s %s", v.Product, v.Stream, v.Version)
}

func (v Version) Download(cfg store.Config, path string) error {
	log.Printf("downloading %s to %s", v.URL, path)
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	netURL, err := url.Parse(v.URL)
	if err != nil {
		return err
	}
	headers := http.Header{}
	if cfg.GetBundleToken() != "" {
		headers.Add("Authorisation", cfg.GetBundleToken())
	}
	req := &http.Request{
		Method: "GET",
		URL:    netURL,
		Header: headers,
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return errors.New("expected 200")
	}
	defer resp.Body.Close()
	_, err = io.Copy(file, resp.Body)

	if err != nil {
		return err
	}

	return verifySHA256(v.SHA256, path)
}

// verifySHA256 verifies that the SHA256 of the file at path matches the given hash.
func verifySHA256(expected []byte, path string) error {
	hasher := sha256.New()
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(hasher, file)
	if err != nil {
		return err
	}
	actual := hasher.Sum(nil)
	if !bytes.Equal(expected, actual) {
		return fmt.Errorf("hash mismatch for %v: expected %x, got %x", path, expected, actual)
	}
	return nil
}
