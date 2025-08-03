package websocketv2

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/coder/websocket"
)

type deviceWebsocketManager struct {
	apiBaseURL                  string
	deviceUUID                  string
	dataVersionCallback         DataVersionCallback
	authorizationHeaderProvider AuthorizationHeaderProvider

	stopChan chan struct{}
	ticker   *time.Ticker

	connectionInstance *connectionInstance
}

func makeDeviceWebsocketManager(apiBaseURL, deviceUUID string, dataVersionCallback DataVersionCallback, authorizationHeaderProvider AuthorizationHeaderProvider) (*deviceWebsocketManager, error) {
	if apiBaseURL == "" {
		return nil, errors.New("apiBaseURL was empty")
	}
	if dataVersionCallback == nil {
		return nil, errors.New("dataVersionCallback was nil")
	}
	if authorizationHeaderProvider == nil {
		return nil, errors.New("authorizationHeaderProvider was nil")
	}
	dwm := &deviceWebsocketManager{
		apiBaseURL:                  apiBaseURL,
		deviceUUID:                  deviceUUID,
		dataVersionCallback:         dataVersionCallback,
		authorizationHeaderProvider: authorizationHeaderProvider,
		stopChan:                    make(chan struct{}, 100),
		ticker:                      time.NewTicker(1 * time.Second), // Heartbeat interval
		connectionInstance:          nil,
	}
	return dwm, nil
}

func (dwm *deviceWebsocketManager) run(ctx context.Context) {
	if dwm.deviceUUID == "" {
		log.Println("deviceUUID is empty, skipping running websocket handler")
		return
	}
	ctx, cancel := context.WithCancel(ctx)
	defer func() {
		cancel()
		dwm.ticker.Stop()
	}()

	for {
		select {
		case <-ctx.Done():
			log.Println("context done, stopping websocket handler")
			return
		case <-dwm.stopChan:
			if dwm.connectionInstance != nil {
				dwm.connectionInstance.stop()
			}
			log.Println("stop signal received, stopping websocket handler")
			return
		case <-dwm.ticker.C:
			err := dwm.handleWebsocketConnection(ctx)
			if err != nil {
				log.Println("error handling websocket connection:", err)
				continue
			}
		}
		time.Sleep(1 * time.Second) // Sleep to avoid busy waiting
	}
}

func (dwm *deviceWebsocketManager) handleWebsocketConnection(ctx context.Context) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	if dwm.connectionInstance == nil || !dwm.connectionInstance.isAlive() {
		log.Printf("creating new websocket connection for deviceUUID: %s", dwm.deviceUUID)
		authHeader, err := dwm.authorizationHeaderProvider(ctx)
		if err != nil {
			return fmt.Errorf("failed to get authorization header: %w", err)
		}
		if authHeader == "" {
			return errors.New("authorization header is empty")
		}
		options := &websocket.DialOptions{
			HTTPHeader: map[string][]string{
				"Authorization": {authHeader},
			},
		}
		conn, resp, err := websocket.Dial(ctx, dwm.getDeviceWebsocketURL(), options)
		if err != nil {
			return fmt.Errorf("failed to connect to websocket: %w", err)
		}
		if resp.StatusCode != 101 {
			return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}
		ci, err := makeConnectionInstance(conn, dwm.dataVersionCallback)
		if err != nil {
			return fmt.Errorf("failed to create connection instance: %w", err)
		}
		dwm.connectionInstance = ci
		go dwm.connectionInstance.run(ctx)
	}

	return nil
}

func (dwm *deviceWebsocketManager) stop() {
	dwm.stopChan <- struct{}{}
}

func (dwm *deviceWebsocketManager) getDeviceWebsocketURL() string {
	return fmt.Sprintf("%s/api/v2/data/%s/ws", dwm.apiBaseURL, dwm.deviceUUID)
}
