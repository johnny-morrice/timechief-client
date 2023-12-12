package authzero

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type AuthZeroClient struct {
	BaseURL string
}

func MakeAuthZeroClient(baseURL string) (AuthZeroClient, error) {
	if baseURL == "" {
		return AuthZeroClient{}, errors.New("baseURL cannot be empty")
	}
	clnt := AuthZeroClient{BaseURL: baseURL}
	return clnt, nil
}

type DeviceCodeResp struct {
	DeviceCode              string `json:"device_code"`
	UserCode                string `json:"user_code"`
	VerificationUri         string `json:"verification_uri"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
	VerificationUriComplete string `json:"verification_uri_complete"`
}

func (clnt AuthZeroClient) GetDeviceCode(clientID, audience string) (DeviceCodeResp, error) {
	// curl --request POST \
	//   --url 'https://timechief-dev.uk.auth0.com/oauth/device/code' \
	//   --header 'content-type: application/x-www-form-urlencoded' \
	//   --data 'client_id=xxxxx' \
	//   --data audience=https://timechief-dev.onrender.com
	url := clnt.BaseURL + "/oauth/device/code"
	payload := strings.NewReader("client_id=" + clientID + "&audience=" + audience)
	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	defer res.Body.Close()
	result := DeviceCodeResp{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	return result, nil
}

func (clnt AuthZeroClient) doAccessTokenPoll(clientID, deviceCode string) (AccessTokenPollingResp, error) {
	if clientID == "" {
		return AccessTokenPollingResp{}, errors.New("clientID cannot be empty")
	}
	if deviceCode == "" {
		return AccessTokenPollingResp{}, errors.New("deviceCode cannot be empty")
	}
	// 	curl --request POST \
	//   --url 'https://timechief-dev.uk.auth0.com/oauth/token' \
	//   --header 'content-type: application/x-www-form-urlencoded' \
	//   --data grant_type=urn:ietf:params:oauth:grant-type:device_code \
	//   --data device_code=YOUR_DEVICE_CODE \
	//   --data 'client_id=7FOJFWufEdZOUvNffztPMm4LoaDl6lrM'
	tokenURL := clnt.BaseURL + "/oauth/token"
	grantType := url.QueryEscape("urn:ietf:params:oauth:grant-type:device_code")
	payload := strings.NewReader("grant_type=" + grantType + "&device_code=" + deviceCode + "&client_id=" + clientID)
	req, err := http.NewRequest("POST", tokenURL, payload)
	if err != nil {
		return AccessTokenPollingResp{}, err
	}
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return AccessTokenPollingResp{}, err
	}
	defer res.Body.Close()
	result := AccessTokenPollingResp{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return AccessTokenPollingResp{}, err
	}
	return result, nil
}

func (clnt AuthZeroClient) GetAccessToken(clientID, deviceCode string, interval time.Duration) (AccessTokenResp, error) {
	if clientID == "" {
		return AccessTokenResp{}, errors.New("clientID cannot be empty")
	}
	if deviceCode == "" {
		return AccessTokenResp{}, errors.New("deviceCode cannot be empty")
	}
	if interval == 0 {
		return AccessTokenResp{}, errors.New("interval cannot be 0")
	}
	for {
		resp, err := clnt.doAccessTokenPoll(clientID, deviceCode)
		if err != nil {
			return AccessTokenResp{}, err
		}
		if resp.Error.Error != "" {
			return AccessTokenResp{}, err
		}
		if resp.Response.AccessToken != "" {
			return resp.Response, nil
		}
		time.Sleep(interval)
	}
}

type AccessTokenPollingResp struct {
	Error    AccessTokenRespError `json:"error"`
	Response AccessTokenResp      `json:"response"`
}

type AccessTokenRespError struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

type AccessTokenResp struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	IDToken      string `json:"id_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}
