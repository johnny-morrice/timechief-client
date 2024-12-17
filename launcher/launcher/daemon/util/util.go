package util

import "time"

func RunEvery(duration time.Duration, f func()) {
	if duration == 0 {
		panic("runEvery duration must be positive")
	}
	for range time.Tick(duration) {
		f()
	}
}
