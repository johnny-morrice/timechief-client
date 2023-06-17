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
	STATE_PLAYING_LOOP
)

type Machine struct {
	state        MachineState
	idleDuration time.Duration
	noteDuration time.Duration
	noteIndex    int
	song         Song
	lock         *sync.Mutex
	tg           ToneGenerator
}

type ToneGenerator interface {
	PlayFreq(freq float32, duration time.Duration)
	Silence(duration time.Duration)
}

func NewMachine(tg ToneGenerator) *Machine {
	return &Machine{
		state:        STATE_IDLE,
		idleDuration: time.Millisecond * 100,
		noteDuration: time.Millisecond * 400,
		noteIndex:    0,
		song:         Song{},
		lock:         &sync.Mutex{},
		tg:           tg,
	}
}

func (m *Machine) StartSong(state MachineState, song Song) error {
	if state == STATE_IDLE {
		return errors.New("cannot start song with state STATE_IDLE")
	}
	log.Printf("starting song: %s", song.Name)
	m.lock.Lock()
	defer m.lock.Unlock()
	m.song = song
	m.noteIndex = 0
	m.state = state
	return nil
}

func (m *Machine) StopSong() error {
	log.Printf("stopping song: %s", m.song.Name)
	m.lock.Lock()
	defer m.lock.Unlock()
	m.state = STATE_IDLE
	return nil
}

func (m *Machine) tick() error {
	m.lock.Lock()
	defer m.lock.Unlock()
	if m.state == STATE_IDLE {
		m.tg.Silence(m.idleDuration)
		return nil
	}
	log.Printf("playing note at index %d", m.noteIndex)
	note := m.song.Notes[m.noteIndex]
	m.playNote(note)
	nextNoteIndex := m.noteIndex + 1
	if nextNoteIndex >= len(m.song.Notes) {
		log.Printf("end of song at note index %d", m.noteIndex)
		switch m.state {
		case STATE_PLAYING_ONCE:
			m.state = STATE_IDLE
		case STATE_PLAYING_LOOP:
			nextNoteIndex = 0
		default:
			return fmt.Errorf("invalid state: %v", m.state)
		}
	}
	m.noteIndex = nextNoteIndex
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
	m.lock.Lock()
	defer m.lock.Unlock()
	if m.state == STATE_IDLE {
		time.Sleep(m.idleDuration)
	} else {
		time.Sleep(m.noteDuration)
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
