package websocketv2

import (
	"context"
	"errors"
	"log"
	"time"
)

type Client struct {
	apiBaseURL                  string
	authorizationHeaderProvider AuthorizationHeaderProvider
	dataVersionCallback         DataVersionCallback
	deviceUUIDProvider          DeviceUUIDProvider
}

type DeviceUUIDProvider <-chan string
type AuthorizationHeaderProvider func(ctx context.Context) (string, error)
type DataVersionCallback chan<- string

func MakeWebsocketClient(apiBaseURL string, authorizationHeaderProvider AuthorizationHeaderProvider, dataVersionCallback DataVersionCallback, deviceUUIDProvider DeviceUUIDProvider) (Client, error) {
	if apiBaseURL == "" {
		return Client{}, errors.New("apiBaseURL was empty")
	}
	if authorizationHeaderProvider == nil {
		return Client{}, errors.New("authorizationHeaderProvider was nil")
	}
	if dataVersionCallback == nil {
		return Client{}, errors.New("dataVersionCallback was nil")
	}
	if deviceUUIDProvider == nil {
		return Client{}, errors.New("deviceUUIDProvider was nil")
	}

	client := Client{
		apiBaseURL:                  apiBaseURL,
		authorizationHeaderProvider: authorizationHeaderProvider,
		dataVersionCallback:         dataVersionCallback,
		deviceUUIDProvider:          deviceUUIDProvider,
	}
	return client, nil
}

func (wc *Client) Run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer func() {
		// Do not block shutdown.
		cancel()
	}()

	wsh, err := wc.makeWebsocketHandler("")
	if err != nil {
		log.Println("error creating websocket handler:", err)
		return
	}
	go wsh.run(ctx) // Start the websocket handler
	for {
		select {
		case <-ctx.Done():
			log.Println("context done, stopping websocket loop")
			wsh.stop(ctx) // Ensure we close the stop channel
			return
		case deviceUUID := <-wc.deviceUUIDProvider:
			wsh.stop(ctx) // Stop the current websocket handler
			if deviceUUID != "" {
				wsh, err = wc.makeWebsocketHandler(deviceUUID)
				if err != nil {
					log.Println("error creating websocket handler for deviceUUID:", deviceUUID, "error:", err)
					return
				}
				go wsh.run(ctx) // Start the new websocket handler
			}
		}
		time.Sleep(1 * time.Second) // Sleep to avoid busy waiting
	}
}

func (wc *Client) makeWebsocketHandler(deviceUUID string) (*websocketHandler, error) {
	panic("not implemented yet") // Placeholder for actual implementation
}
