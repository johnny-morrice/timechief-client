package client

import (
	"time"
)

type ClientConfig struct {
	BaseURL          string
	HTTPTimeout      time.Duration
	RetryWaitTime    time.Duration
	RetryMaxWaitTime time.Duration
	RetryCount       int
	DumpHTTP         bool
}
