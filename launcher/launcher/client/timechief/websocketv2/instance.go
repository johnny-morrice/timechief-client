package websocketv2

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"github.com/coder/websocket"
	"golang.org/x/time/rate"
)

type connectionInstance struct {
	conn                *websocket.Conn
	dataVersionCallback DataVersionCallback

	stopChan        chan struct{}
	readTimeout     time.Duration
	writeTimeout    time.Duration
	heatbeatTimeout time.Duration
	ticker          *time.Ticker
	aliveFlag       aliveFlag
}

type aliveFlag struct {
	*sync.RWMutex
	alive bool
}

type websocketMessage struct {
	Kind    string `json:"kind"`
	Message string `json:"message"`
}

func makeConnectionInstance(conn *websocket.Conn, dataVersionCallback DataVersionCallback) (*connectionInstance, error) {
	if conn == nil {
		return nil, errors.New("websocket connection was nil")
	}
	if dataVersionCallback == nil {
		return nil, errors.New("dataVersionCallback was nil")
	}
	ci := &connectionInstance{
		conn:                conn,
		dataVersionCallback: dataVersionCallback,
		stopChan:            make(chan struct{}, 100),
		readTimeout:         15 * time.Second,
		writeTimeout:        15 * time.Second,
		heatbeatTimeout:     30 * time.Second,
		ticker:              time.NewTicker(10 * time.Second), // Heartbeat interval
		aliveFlag: aliveFlag{
			RWMutex: &sync.RWMutex{},
			alive:   true,
		},
	}
	return ci, nil
}

var errDeadWebsocketHandler = errors.New("websocket connection is dead")

func (ci *connectionInstance) run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer func() {
		cancel()
		ci.ticker.Stop()
		ci.markDead()

		ci.conn.Close(websocket.StatusNormalClosure, `{"kind":"close","message":"client websocket handler shutdown"}`) // Close the websocket connection gracefully
	}()

	lastHeartbeat := time.Now()
	heartbeatChan := make(chan bool)
	go ci.readWebsocketLoop(ctx, heartbeatChan)
	for {
		select {
		case <-ctx.Done():
			log.Println("context done, stopping connection instance")
			return
		case <-ci.stopChan:
			log.Println("stop signal received, stopping connection instance")
			return
		case running := <-heartbeatChan:
			if running {
				lastHeartbeat = time.Now()
			} else {
				log.Printf("websocket reader stopped, stopping connection instance")
				return
			}
		case <-ci.ticker.C:
			if time.Since(lastHeartbeat) > ci.heatbeatTimeout {
				log.Println("heartbeat timeout exceeded, stopping connection instance")
				return
			}
			err := ci.writeHeartbeat(ctx)
			if err != nil {
				if errors.Is(err, errDeadWebsocketHandler) {
					log.Println("websocket connection is dead, stopping connection instance")
					return
				}
				log.Println("error writing heartbeat:", err)
				continue
			}
			time.Sleep(1 * time.Second) // Sleep to avoid busy waiting
		}
	}

}

func (ci *connectionInstance) readWebsocketLoop(ctx context.Context, heartbeatChan chan<- bool) {
	log.Printf("starting websocket read loop")
	defer func() {
		log.Printf("websocket read loop stopped")
		close(heartbeatChan)
	}()
	limiter := rate.NewLimiter(rate.Every(5*time.Second), 10)
	for ctx.Err() == nil {
		err := limiter.Wait(ctx) // Rate limit the read operations.
		if err != nil {
			log.Printf("error waiting for rate limiter: %s", err)
			return
		}
		err = ci.readWebsocket(ctx, heartbeatChan)
		if err != nil {
			if errors.Is(err, errDeadWebsocketHandler) {
				log.Printf("websocket handler is dead, stopping read loop")
				return
			}
			log.Printf("error reading from websocket: %s", err)
			continue
		}
	}
}

func (ci *connectionInstance) readWebsocket(ctx context.Context, heartbeatChan chan<- bool) error {
	var cancel context.CancelFunc
	ctx, cancel = context.WithTimeout(ctx, ci.readTimeout)
	defer cancel()
	// Check if the server sent a heartbeat message
	var msg websocketMessage
	typ, r, err := ci.conn.Reader(ctx)
	if err != nil {
		return fmt.Errorf("failed to get websocket reader: %w", err)
	}

	if typ != websocket.MessageText {
		_, err = io.Copy(io.Discard, r)
		if err != nil {
			log.Printf("failed to discard non-text message: %s", err)
		}
		return errors.New("expected text message")
	}
	// Read to EOF
	wholeMessageBytes, err := io.ReadAll(r)
	if err != nil {
		return fmt.Errorf("failed to read from websocket: %w", err)
	}

	err = json.Unmarshal(wholeMessageBytes, &msg)
	if err != nil {
		return fmt.Errorf("failed to decode from websocket message: %w", err)
	}

	if msg.Kind != "heartbeat" {
		log.Printf("received non-heartbeat message: %v", wholeMessageBytes)
		return nil
	}

	heartbeatChan <- true

	return nil
}

func (ci *connectionInstance) writeHeartbeat(ctx context.Context) error {
	err := ci.doWriteHeartbeat(ctx)
	if err != nil {
		// All errors related to writing a heartbeat are considered fatal.
		return errors.Join(errDeadWebsocketHandler, err)
	}
	return nil
}

func (ci *connectionInstance) doWriteHeartbeat(ctx context.Context) error {
	// log.Printf("writing heartbeat to websocket")
	w, err := ci.conn.Writer(ctx, websocket.MessageText)
	if err != nil {
		return fmt.Errorf("failed to get websocket writer: %w", err)
	}
	defer func() {
		err := w.Close()
		if err != nil {
			log.Printf("failed to close websocket writer: %s", err)
		}
	}()

	err = json.NewEncoder(w).Encode(websocketMessage{
		Kind:    "heartbeat",
		Message: "client heartbeat",
	})
	if err != nil {
		return fmt.Errorf("failed to encode heartbeat message: %w", err)
	}

	return nil
}

func (ci *connectionInstance) stop(ctx context.Context) {
	close(ci.stopChan)
}

func (ci *connectionInstance) markDead() {
	ci.aliveFlag.Lock()
	defer ci.aliveFlag.Unlock()
	ci.aliveFlag.alive = false
}

func (ci *connectionInstance) isAlive() bool {
	if ci == nil {
		return false
	}
	ci.aliveFlag.RLock()
	defer ci.aliveFlag.RUnlock()
	return ci.aliveFlag.alive
}
