package music

import (
	"errors"
	"fmt"
	"log"
	"sync"
	"time"
)

type MachineState uint8

const (
	STATE_IDLE MachineState = iota
	STATE_PLAYING_ONCE
	STATE_FLAYING_LOOP
)

type Machine struct {
	State        MachineState
	IdleDuration time.Duration
	NoteDuration time.Duration
	NoteIndex    int
	Song         Song
	Lock         *sync.Mutex
}

func NewMachine() *Machine {
	return &Machine{
		State:        STATE_IDLE,
		IdleDuration: time.Millisecond * 100,
		NoteDuration: time.Millisecond * 10,
		NoteIndex:    0,
		Song:         Song{},
		Lock:         &sync.Mutex{},
	}
}

func (m *Machine) StartSong(state MachineState, song Song) error {
	if state == STATE_IDLE {
		return errors.New("cannot start song with state STATE_IDLE")
	}
	m.Lock.Lock()
	defer m.Lock.Unlock()
	m.Song = song
	m.NoteIndex = 0
	m.State = state
	return nil
}

func (m *Machine) StopSong() {
	m.Lock.Lock()
	defer m.Lock.Unlock()
	m.State = STATE_IDLE
}

func (m *Machine) tick() error {
	m.Lock.Lock()
	defer m.Lock.Unlock()
	if m.State == STATE_IDLE {
		m.silence()
		return nil
	}
	note := m.Song.Notes[m.NoteIndex]
	m.playNote(note)
	nextNoteIndex := m.NoteIndex + 1
	if nextNoteIndex >= len(m.Song.Notes) {
		switch m.State {
		case STATE_PLAYING_ONCE:
			m.State = STATE_IDLE
		case STATE_FLAYING_LOOP:
			nextNoteIndex = 0
		default:
			return fmt.Errorf("invalid state: %v", m.State)
		}
	}
	m.NoteIndex = nextNoteIndex
	return nil
}

func (m *Machine) Run() {
	for {
		err := m.tick()
		if err != nil {
			log.Printf("error in music machine: %v", err)
		}
		m.Sleep()
	}
}

func (m *Machine) Sleep() {
	m.Lock.Lock()
	defer m.Lock.Unlock()
	if m.State == STATE_IDLE {
		time.Sleep(m.IdleDuration)
	} else {
		time.Sleep(m.NoteDuration)
	}
}

func (m *Machine) playNote(n Note) {
	// TODO implement
}

func (m *Machine) silence() {
	// TODO implement
}

type Note struct {
	PWMFreq int
	Silence bool
}

type Song struct {
	Notes []Note
}
