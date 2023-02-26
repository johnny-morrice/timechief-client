package main

import (
	"encoding/json"
	"errors"
	"net/http"
)

type ArtifactAPIClient struct {
	RootURL string
}

func (api ArtifactAPIClient) GetJSON(url string, obj interface{}) error {
	response, err := http.Get(api.RootURL + url)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return errors.New("expected 200")
	}
	return json.NewDecoder(response.Body).Decode(obj)
}

func (api ArtifactAPIClient) FetchVersions() ([]Version, error) {
	var versions []Version
	err := api.GetJSON("/artifact/versions", &versions)
	return versions, err
}
