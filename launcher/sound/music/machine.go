package music

import (
	"errors"
	"fmt"
	"log"
	"sync/atomic"
	"time"
)

type StateFlag uint8

const (
	STATE_IDLE StateFlag = iota
	STATE_PLAYING_ONCE
	STATE_PLAYING_LOOP
)

type machineState struct {
	flag      StateFlag
	song      Song
	noteIndex int
}

type Machine struct {
	idleDuration time.Duration
	noteDuration time.Duration
	state        atomic.Value
	forceStop    atomic.Bool
	tg           ToneGenerator
}

type ToneGenerator interface {
	PlayFreq(freq float32, duration time.Duration)
	Silence(duration time.Duration)
}

func NewMachine(tg ToneGenerator) *Machine {
	m := &Machine{
		idleDuration: time.Millisecond * 100,
		noteDuration: time.Millisecond * 40,
		tg:           tg,
	}
	m.state.Store(machineState{
		flag: STATE_IDLE,
	})
	return m
}

func (m *Machine) StartSong(state StateFlag, song Song) error {
	if state == STATE_IDLE {
		return errors.New("cannot start song with state STATE_IDLE")
	}
	log.Printf("starting song: %s", song.Name)
	m.state.Store(machineState{
		flag:      state,
		song:      song,
		noteIndex: 0,
	})
	m.forceStop.Store(false)
	return nil
}

func (m *Machine) StopSong() error {
	log.Printf("stopping song")
	m.forceStop.Store(true)
	return nil
}

func (m *Machine) tick() error {
	state := m.state.Load().(machineState)
	if state.flag == STATE_IDLE {
		m.tg.Silence(m.idleDuration)
		return nil
	}
	note := state.song.Notes[state.noteIndex]
	m.playNote(note)
	nextNoteIndex := state.noteIndex + 1
	if nextNoteIndex >= len(state.song.Notes) {
		log.Printf("end of song at note index %d", state.noteIndex)
		switch state.flag {
		case STATE_PLAYING_ONCE:
			state.flag = STATE_IDLE
		case STATE_PLAYING_LOOP:
			nextNoteIndex = 0
		default:
			return fmt.Errorf("invalid state: %v", m.state)
		}
	}
	state.noteIndex = nextNoteIndex
	isStopped := m.forceStop.Load()
	if isStopped {
		state.flag = STATE_IDLE
	}
	m.state.Store(state)
	return nil
}

func (m *Machine) Run() {
	for {
		err := m.tick()
		if err != nil {
			log.Printf("error in music machine: %v", err)
		}
	}
}

func (m *Machine) playNote(n Note) {
	if n.Silence {
		m.silence()
	} else {
		m.tg.PlayFreq(n.PWMFreq, m.noteDuration)
	}
}

func (m *Machine) silence() {
	m.tg.Silence(m.noteDuration)
}

type Note struct {
	PWMFreq float32
	Silence bool
}

type Song struct {
	Name  string
	Notes []Note
}
