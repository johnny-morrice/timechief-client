package adaptivetick

import (
	"fmt"
	"log"
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
	doLog           bool
}

func NewTwoModeTicker(doLog bool, exceedThreshold time.Duration, underThreshold time.Duration, threshold time.Duration, timeout time.Duration, pokeCount int) (*TwoModeTicker, error) {
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
		doLog:           doLog,
	}, nil
}

func (t *TwoModeTicker) Poke() {
	t.logPrintf("ticker poked at %s", time.Now())

	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.pokes = append([]time.Time{time.Now()}, t.pokes...)
	if t.pokeCount < len(t.pokes) {
		t.pokes = t.pokes[:t.pokeCount]
	}
}

func (t *TwoModeTicker) Tick() <-chan struct{} {
	out := make(chan struct{})
	go func() {
		for {
			if t.isFastMode() {
				t.logPrintf("ticker is in fast mode")
				time.Sleep(t.underThreshold)
			} else {
				t.logPrintf("ticker is in slow mode")
				startSleep := time.Now()
				for !t.isFastMode() && time.Since(startSleep) < t.exceedThreshold {
					t.logPrintf("ticker is in slow mode, waiting")
					time.Sleep(t.underThreshold)
				}
			}
			out <- struct{}{}
		}
	}()
	return out
}

func (t *TwoModeTicker) isFastMode() bool {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	lastPoke := t.pokes[0]
	if time.Since(lastPoke) > t.timeout {
		return false
	}

	average := averageDurationBetweenTimes(t.pokes)
	t.logPrintf("average duration between pokes: %s", average)
	t.logPrintf("pokes: %v", t.pokes)
	return average < t.threshold
}

func (t *TwoModeTicker) logPrintf(message string, args ...interface{}) {
	if t.doLog {
		log.Printf(message, args...)
	}
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
