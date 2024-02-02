package daemonclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/launcher"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type DaemonClient struct {
	BaseURL string
}

func NewDaemonClient(baseURL string) DaemonClient {
	return DaemonClient{BaseURL: baseURL}
}

func (dc DaemonClient) makeURL(path string) string {
	return dc.BaseURL + path
}

func (dc DaemonClient) GetConfig() (store.Config, error) {
	resp, err := http.Get(dc.makeURL("/api/launcher/config"))
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
	resp, err := http.Get(dc.makeURL("/api/launcher/target/env"))
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
	resp, err := http.Get(dc.makeURL("/api/launcher/target"))
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
	resp, err := http.Post(dc.makeURL("/api/launcher/target/recover"), "", nil)
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
	resp, err := http.Post(dc.makeURL("/api/system/reboot"), "", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

type PlaySoundRequest struct {
	SongName string
	Loop     bool
}

func (dc DaemonClient) PostPlaySound(req PlaySoundRequest) error {
	buf := bytes.Buffer{}
	err := json.NewEncoder(&buf).Encode(req)
	if err != nil {
		return err
	}
	resp, err := http.Post(dc.makeURL("/api/sound/play"), "application/json", &buf)
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
