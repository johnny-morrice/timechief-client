package daemonclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/credfile"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/launcher"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type DaemonClient struct {
	baseURL string
	apiKey  string
}

type CredentialProvider struct {
	CredentialPath string
	APIKey         string
}

func NewDaemonClient(baseURL string, creds CredentialProvider) (DaemonClient, error) {
	if baseURL == "" {
		return DaemonClient{}, fmt.Errorf("baseURL is required")
	}
	apiKey := creds.APIKey
	var err error
	if creds.CredentialPath != "" {
		apiKey, err = credfile.ReadCredentials(creds.CredentialPath)
		if err != nil {
			return DaemonClient{}, fmt.Errorf("error reading credentials: %w", err)
		}
	}

	dc := DaemonClient{
		baseURL: baseURL,
		apiKey:  apiKey,
	}
	return dc, nil
}

func (dc DaemonClient) makeURL(path string) string {
	return dc.baseURL + path
}

func (dc DaemonClient) get(path string) (*http.Response, error) {
	req, err := http.NewRequest("GET", dc.makeURL(path), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+dc.apiKey)
	return http.DefaultClient.Do(req)
}

func (dc DaemonClient) post(path, contentType string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest("POST", dc.makeURL(path), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+dc.apiKey)
	if contentType != "" {
		req.Header.Add("Content-Type", contentType)
	}
	if body != nil {
		nopCloser := io.NopCloser(body)
		req.Body = nopCloser
	}

	return http.DefaultClient.Do(req)
}

func (dc DaemonClient) GetConfig() (store.Config, error) {
	resp, err := dc.get("/api/launcher/config")
	if err != nil {
		return store.Config{}, err
	}
	defer resp.Body.Close()

	result := store.Config{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return store.Config{}, err
	}

	return result, nil
}

func (dc DaemonClient) GetTargetEnv() (launcher.TargetEnv, error) {
	resp, err := dc.get("/api/launcher/target/env")
	if err != nil {
		return launcher.TargetEnv{}, err
	}
	defer resp.Body.Close()
	result := launcher.TargetEnv{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return launcher.TargetEnv{}, err
	}
	return result, nil
}

func (dc DaemonClient) GetTarget() (service.LaunchTarget, error) {
	resp, err := dc.get("/api/launcher/target")
	if err != nil {
		return service.LaunchTarget{}, err
	}
	defer resp.Body.Close()

	result := service.LaunchTarget{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return service.LaunchTarget{}, err
	}

	return result, nil
}

func (dc DaemonClient) PostTargetRecover() (launcher.TargetStatus, error) {
	resp, err := dc.post("/api/launcher/target/recover", "", nil)
	if err != nil {
		return launcher.TargetStatus{}, err
	}
	defer resp.Body.Close()

	result := launcher.TargetStatus{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return launcher.TargetStatus{}, err
	}

	return result, nil
}

func (dc DaemonClient) PostReboot() error {
	resp, err := dc.post("/api/system/reboot", "", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

type PlaySoundRequest struct {
	SongName string `json:"song_name"`
	Loop     bool   `json:"loop"`
}

func (dc DaemonClient) PostPlaySound(req PlaySoundRequest) error {
	buf := bytes.Buffer{}
	err := json.NewEncoder(&buf).Encode(req)
	if err != nil {
		return err
	}
	resp, err := dc.post("/api/sound/play", "application/json", &buf)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("unexpected status code: %v", resp.StatusCode)
	}
	return nil
}

func unmarsalJSON(resp *http.Response, result interface{}) error {
	decoder := json.NewDecoder(resp.Body)
	return decoder.Decode(result)
}
