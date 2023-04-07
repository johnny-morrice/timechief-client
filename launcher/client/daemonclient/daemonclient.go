package daemonclient

import (
	"encoding/json"
	"net/http"

	"github.com/johnny-morrice/timechief-client/launcher/service"
	"github.com/johnny-morrice/timechief-client/launcher/store"
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

func (dc DaemonClient) GetDeviceData() (service.DeviceData, error) {
	resp, err := http.Get(dc.makeURL("/api/device"))
	if err != nil {
		return service.DeviceData{}, err
	}
	defer resp.Body.Close()

	result := service.DeviceData{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return service.DeviceData{}, err
	}

	return result, nil
}

func (dc DaemonClient) GetConfig() (store.Config, error) {
	resp, err := http.Get(dc.makeURL("/api/config"))
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

func (dc DaemonClient) GetTarget() (service.LaunchTarget, error) {
	resp, err := http.Get(dc.makeURL("/api/target"))
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

func (dc DaemonClient) PostTargetRecover() (service.TargetStatus, error) {
	resp, err := http.Post(dc.makeURL("/api/target/recover"), "", nil)
	if err != nil {
		return service.TargetStatus{}, err
	}
	defer resp.Body.Close()

	result := service.TargetStatus{}
	err = unmarsalJSON(resp, &result)
	if err != nil {
		return service.TargetStatus{}, err
	}

	return result, nil
}

func unmarsalJSON(resp *http.Response, result interface{}) error {
	decoder := json.NewDecoder(resp.Body)
	return decoder.Decode(result)
}
