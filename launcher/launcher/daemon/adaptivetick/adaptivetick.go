package adaptivetick

import (
	"fmt"
	"sync"
	"time"
)

type TwoModeTicker struct {
	exceedThreshold time.Duration
	underThreshold  time.Duration
	threshold       time.Duration
	timeout         time.Duration
	mutex           *sync.RWMutex
	pokeCount       int
	pokes           []time.Time
}

func NewTwoModeTicker(exceedThreshold time.Duration, underThreshold time.Duration, threshold time.Duration, timeout time.Duration, pokeCount int) (*TwoModeTicker, error) {
	if exceedThreshold <= 0 || underThreshold <= 0 || threshold <= 0 || timeout <= 0 || pokeCount <= 0 {
		return nil, fmt.Errorf("all durations and pokeCount must be greater than 0")
	}
	return &TwoModeTicker{
		exceedThreshold: exceedThreshold,
		underThreshold:  underThreshold,
		timeout:         timeout,
		threshold:       threshold,
		mutex:           &sync.RWMutex{},
		pokeCount:       pokeCount,
		pokes:           []time.Time{time.Now()},
	}, nil
}

func (t *TwoModeTicker) Poke() {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.pokes = append([]time.Time{time.Now()}, t.pokes...)
	if t.pokeCount < len(t.pokes) {
		t.pokes = t.pokes[:t.pokeCount-1]
	}
}

func (t *TwoModeTicker) Tick() <-chan struct{} {
	out := make(chan struct{})
	go func() {
		for {
			if t.isUnderThreshold() {
				time.Sleep(t.underThreshold)
			} else {
				startSleep := time.Now()
				for !t.isUnderThreshold() && time.Since(startSleep) < t.exceedThreshold {
					time.Sleep(t.underThreshold)
				}
			}
			out <- struct{}{}
		}
	}()
	return out
}

func (t *TwoModeTicker) isUnderThreshold() bool {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	lastPoke := t.pokes[0]
	if time.Since(lastPoke) > t.timeout {
		return false
	}

	average := averageDurationBetweenTimes(t.pokes)
	return average < t.threshold
}

func averageDurationBetweenTimes(times []time.Time) time.Duration {
	if len(times) < 2 {
		return time.Duration(0)
	}
	durations := make([]time.Duration, 0)
	for i := 0; i < len(times)-1; i++ {
		dur := times[i].Sub(times[i+1])
		if dur >= 0 {
			durations = append(durations, dur)
		}
	}
	average := time.Duration(0)
	for _, d := range durations {
		average += d
	}
	if len(durations) == 0 {
		return time.Duration(0)
	}
	return average / time.Duration(len(durations))
}
