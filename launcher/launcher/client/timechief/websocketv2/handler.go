package websocketv2

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/coder/websocket"
)

type websocketHandler struct {
	apiBaseURL                  string
	deviceUUID                  string
	dataVersionCallback         DataVersionCallback
	authorizationHeaderProvider AuthorizationHeaderProvider

	stopChan chan struct{}
	ticker   *time.Ticker

	connectionInstance *connectionInstance
}

func makeWebsocketHandler(apiBaseURL, deviceUUID string, dataVersionCallback DataVersionCallback, authorizationHeaderProvider AuthorizationHeaderProvider) (*websocketHandler, error) {
	wsh := &websocketHandler{}
	return wsh, nil
}

func (wsh *websocketHandler) run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer func() {
		cancel()
		wsh.ticker.Stop()
	}()

	for {
		select {
		case <-ctx.Done():
			log.Println("context done, stopping websocket handler")
			return
		case <-wsh.stopChan:
			if wsh.connectionInstance != nil {
				wsh.connectionInstance.stop(ctx)
			}
			log.Println("stop signal received, stopping websocket handler")
			return
		case <-wsh.ticker.C:
			err := wsh.handleWebsocketConnection(ctx)
			if err != nil {
				log.Println("error handling websocket connection:", err)
				continue
			}
		}
		time.Sleep(1 * time.Second) // Sleep to avoid busy waiting
	}
}

func (wsh *websocketHandler) handleWebsocketConnection(ctx context.Context) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	if wsh.connectionInstance == nil || !wsh.connectionInstance.isAlive() {
		authHeader, err := wsh.authorizationHeaderProvider(ctx)
		if err != nil {
			return fmt.Errorf("failed to get authorization header: %w", err)
		}
		options := &websocket.DialOptions{
			HTTPHeader: map[string][]string{
				"Authorization": {authHeader},
			},
		}
		conn, resp, err := websocket.Dial(ctx, wsh.getDeviceWebsocketURL(), options)
		if err != nil {
			return fmt.Errorf("failed to connect to websocket: %w", err)
		}
		if resp.StatusCode != 101 {
			return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}
		ci, err := makeConnectionInstance(conn, wsh.dataVersionCallback)
		if err != nil {
			return fmt.Errorf("failed to create connection instance: %w", err)
		}
		wsh.connectionInstance = ci
		go wsh.connectionInstance.run(ctx)
	}

	return nil
}

func (wsh *websocketHandler) stop(ctx context.Context) {

}

func (wsh *websocketHandler) getDeviceWebsocketURL() string {
	return fmt.Sprintf("%s/api/v2/data/%s/ws", wsh.apiBaseURL, wsh.deviceUUID)
}
