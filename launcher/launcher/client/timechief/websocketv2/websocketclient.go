package websocketv2

import (
	"context"
	"errors"
	"log"
	"time"
)

type WebsocketClient struct {
	apiBaseURL                  string
	authorizationHeaderProvider AuthorizationHeaderProvider
	dataVersionCallback         DataVersionCallback
	deviceUUIDProvider          DeviceUUIDProvider
	ticker                      *time.Ticker
}

type DeviceUUIDProvider <-chan string
type AuthorizationHeaderProvider func(ctx context.Context) (string, error)
type DataVersionCallback chan<- string

func MakeWebsocketClient(apiBaseURL string, bearerTokenProvider AuthorizationHeaderProvider, dataVersionCallback DataVersionCallback, deviceUUIDProvider DeviceUUIDProvider, restartChannel <-chan bool) (WebsocketClient, error) {
	if apiBaseURL == "" {
		return WebsocketClient{}, errors.New("apiBaseURL was empty")
	}
	if bearerTokenProvider == nil {
		return WebsocketClient{}, errors.New("bearerTokenProvider was nil")
	}
	if dataVersionCallback == nil {
		return WebsocketClient{}, errors.New("dataVersionCallback was nil")
	}
	if deviceUUIDProvider == nil {
		return WebsocketClient{}, errors.New("deviceUUIDProvider was nil")
	}
	if restartChannel == nil {
		return WebsocketClient{}, errors.New("restartChannel was nil")
	}
	client := WebsocketClient{
		apiBaseURL:                  apiBaseURL,
		authorizationHeaderProvider: bearerTokenProvider,
		dataVersionCallback:         dataVersionCallback,
		deviceUUIDProvider:          deviceUUIDProvider,
		ticker:                      time.NewTicker(1 * time.Second), // Default ticker interval
	}
	return client, nil
}

func (wc *WebsocketClient) Run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer func() {
		// Do not block shutdown.
		cancel()
		wc.ticker.Stop()
	}()
	currentDeviceUUID := ""
	for range wc.ticker.C {
		select {
		case <-ctx.Done():
			log.Println("context done, stopping websocket loop")

			return
		case deviceUUID := <-wc.deviceUUIDProvider:
			if deviceUUID == "" {
				// Stop the client
			} else if deviceUUID != currentDeviceUUID {
				// Restart the websocket
			}
		}
	}
}
