package authzero

import (
	"encoding/json"
	"net/http"
	"strings"
)

type AuthZeroClient struct {
	BaseURL string
}

type DeviceCode struct {
	DeviceCode              string `json:"device_code"`
	UserCode                string `json:"user_code"`
	VerificationUri         string `json:"verification_uri"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
	VerificationUriComplete string `json:"verification_uri_complete"`
}

func (clnt AuthZeroClient) GetDeviceCode(clientID, audience string) (DeviceCode, error) {
	// curl --request POST \
	//   --url 'https://timechief-dev.uk.auth0.com/oauth/device/code' \
	//   --header 'content-type: application/x-www-form-urlencoded' \
	//   --data 'client_id=xxxxx' \
	//   --data audience=https://timechief-dev.onrender.com
	url := clnt.BaseURL + "/oauth/device/code"
	payload := strings.NewReader("client_id=" + clientID + "&audience=" + audience)
	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		return DeviceCode{}, err
	}
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return DeviceCode{}, err
	}
	defer res.Body.Close()
	result := DeviceCode{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return DeviceCode{}, err
	}
	return result, nil
}
