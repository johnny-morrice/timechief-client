package authzero

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
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

func (clnt AuthZeroClient) GetDeviceCode(ctx context.Context, clientID, audience string) (DeviceCodeResp, error) {
	// curl --request POST \
	//   --url 'https://timechief-dev.uk.auth0.com/oauth/device/code' \
	//   --header 'content-type: application/x-www-form-urlencoded' \
	//   --data 'client_id=xxxxx' \
	//   --data audience=https://timechief-dev.onrender.com
	if clientID == "" {
		return DeviceCodeResp{}, errors.New("clientID cannot be empty")
	}
	if audience == "" {
		return DeviceCodeResp{}, errors.New("audience cannot be empty")
	}
	url := clnt.BaseURL + "/oauth/device/code"
	payload := strings.NewReader("client_id=" + clientID + "&audience=" + audience + "&scope=offline_access")
	req, err := http.NewRequest("POST", url, payload)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	req = req.WithContext(ctx)
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		// Log body
		bodyContent := make([]byte, 1000)
		n, _ := res.Body.Read(bodyContent)
		log.Printf("error getting device code: %s %s", res.Status, string(bodyContent[:n]))
		return DeviceCodeResp{}, fmt.Errorf("error getting device code: %s", res.Status)
	}
	result := DeviceCodeResp{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return DeviceCodeResp{}, err
	}
	if result.DeviceCode == "" {
		return result, fmt.Errorf("error getting device code: %v", result)
	}
	return result, nil
}

func (clnt AuthZeroClient) RefreshAccessToken(ctx context.Context, clientID, refreshToken string) (AccessTokenResp, error) {
	if clientID == "" {
		return AccessTokenResp{}, errors.New("clientID cannot be empty")
	}
	if refreshToken == "" {
		return AccessTokenResp{}, errors.New("refreshToken cannot be empty")
	}

	tokenURL := clnt.BaseURL + "/oauth/token"

	refreshToken = url.QueryEscape(refreshToken)
	payload := strings.NewReader("grant_type=refresh_token" + "&client_id=" + clientID + "&refresh_token=" + refreshToken + "&scope=offline_access")

	req, err := http.NewRequest("POST", tokenURL, payload)

	if err != nil {
		return AccessTokenResp{}, fmt.Errorf("error creating refresh token request")
	}

	req = req.WithContext(ctx)

	req.Header.Add("content-type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return AccessTokenResp{}, err
	}
	defer res.Body.Close()
	result := AccessTokenResp{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return AccessTokenResp{}, err
	}
	if result.Error != "" {
		return result, fmt.Errorf("error refreshing token: %s %s", result.Error, result.ErrorDescription)
	}
	// Hack around no new refresh token.
	if result.RefreshToken == "" {
		log.Println("no refresh token in response, using original")
		result.RefreshToken = refreshToken
	}

	return result, nil
}

func (clnt AuthZeroClient) GetAccessToken(ctx context.Context, clientID, deviceCode string) (AccessTokenResp, error) {
	if clientID == "" {
		return AccessTokenResp{}, errors.New("clientID cannot be empty")
	}
	if deviceCode == "" {
		return AccessTokenResp{}, errors.New("deviceCode cannot be empty")
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
		return AccessTokenResp{}, err
	}
	req = req.WithContext(ctx)
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return AccessTokenResp{}, err
	}
	defer res.Body.Close()
	result := AccessTokenResp{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return AccessTokenResp{}, err
	}
	return result, nil
}

type AccessTokenResp struct {
	Error            string `json:"error,omitempty"`
	ErrorDescription string `json:"error_description,omitempty"`
	AccessToken      string `json:"access_token,omitempty"`
	RefreshToken     string `json:"refresh_token,omitempty"`
	IDToken          string `json:"id_token,omitempty"`
	TokenType        string `json:"token_type,omitempty"`
	ExpiresIn        int    `json:"expires_in,omitempty"`
}
