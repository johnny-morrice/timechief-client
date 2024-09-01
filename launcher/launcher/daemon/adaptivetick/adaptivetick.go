package adaptivetick

import (
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

func NewTwoModeTicker(exceedThreshold time.Duration, underThreshold time.Duration, threshold time.Duration, timeout time.Duration, pokeCount int) *TwoModeTicker {
	return &TwoModeTicker{
		exceedThreshold: exceedThreshold,
		underThreshold:  underThreshold,
		timeout:         timeout,
		threshold:       threshold,
		mutex:           &sync.RWMutex{},
		pokeCount:       pokeCount,
		pokes:           []time.Time{time.Now()},
	}
}

func (t *TwoModeTicker) Poke() {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.pokes = append([]time.Time{time.Now()}, t.pokes...)
	if t.pokeCount > len(t.pokes) {
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
				time.Sleep(t.exceedThreshold)
			}
			out <- struct{}{}
		}
	}()
	return out
}

func (t *TwoModeTicker) isUnderThreshold() bool {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	lastPoke := t.pokes[len(t.pokes)-1]
	if lastPoke.Add(t.timeout).Before(time.Now()) {
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
		durations = append(durations, times[i+1].Sub(times[i]))
	}
	average := time.Duration(0)
	for _, d := range durations {
		average += d
	}
	return average / time.Duration(len(durations))
}
