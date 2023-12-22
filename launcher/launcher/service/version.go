package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Version struct {
	UUID    string
	Version string
	Product string
	Stream  string
	SHA256  []byte
	Command string
}

func VersionFromStore(storeVersion store.Version) Version {
	return Version{
		UUID:    storeVersion.UUID,
		Version: storeVersion.Version,
		Product: storeVersion.Product,
		Stream:  storeVersion.Stream,
		SHA256:  storeVersion.SHA256,
		Command: storeVersion.Command,
	}
}

func (v Version) Details() string {
	return fmt.Sprintf("%s %s %s", v.Product, v.Stream, v.Version)
}

func (v Version) Download(cfg store.Config, path string) error {
	panic("removed")
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

type VersionDownloader struct {
	cfgStore store.ConfigStore
	client   v2.ClientInterface
}

func MakeVersionDownloader(cfgStore store.ConfigStore, client v2.ClientInterface) VersionDownloader {
	return VersionDownloader{
		cfgStore: cfgStore,
		client:   client,
	}
}

// TODO use a timeout from the config?
const defaultTimeout = 10 * time.Second

func (vd VersionDownloader) fetchVersionDownload(version Version) (v2.VersionDownload, error) {
	requestContext := context.Background()
	requestContext, cancel := context.WithTimeout(requestContext, defaultTimeout)
	defer cancel()
	resp, err := vd.client.GetVersionDownloadById(requestContext, version.UUID)
	if err != nil {
		return v2.VersionDownload{}, fmt.Errorf("error fetching version download: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return v2.VersionDownload{}, fmt.Errorf("expected 200, got %d", resp.StatusCode)
	}
	var download v2.VersionDownload
	err = json.NewDecoder(resp.Body).Decode(&download)
	if err != nil {
		return v2.VersionDownload{}, fmt.Errorf("error decoding version download: %v", err)
	}
	return download, nil
}

func (vd VersionDownloader) Download(version Version, path string) error {
	log.Printf("downloading version %s", version.Details())
	downloadURL := ""
	log.Printf("downloading %s to %s", downloadURL, path)
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	netURL, err := url.Parse(downloadURL)
	if err != nil {
		return err
	}
	headers := http.Header{}
	cfg, err := vd.cfgStore.GetConfig()
	if err != nil {
		return err
	}
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

	return verifySHA256(version.SHA256, path)
}
