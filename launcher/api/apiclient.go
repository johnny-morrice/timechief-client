package api

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

type Page struct {
	NextCursor string
	PrevCursor string
}

type VersionPage struct {
	Page
	Versions []Version
}

type Version struct {
	UUID    string
	Version string
	Product string
	Stream  string
	URL     string
	SHA256  string
	Command string
}

func (api ArtifactAPIClient) FetchVersions() (VersionPage, error) {
	var versions VersionPage
	err := api.GetJSON("/artifact/versions", &versions)
	return versions, err
}
