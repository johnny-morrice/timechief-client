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
	state        machineState
	tg           ToneGenerator
	change       atomic.Value
}

type machineChange struct {
	state    machineState
	isChange bool
}

func init() {
	// Quick typecheck that we can compare songs.
	// This is a bit of a hack, but it's to make sure we've not put in any non-comparable stuff into machineChange.
	changeA := machineChange{}
	changeB := machineChange{}
	equal := changeA == changeB
	if !equal {
		panic("BUG: machine change comparison check failed")
	}
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
	m.change.Store(machineChange{})
	return m
}

func (m *Machine) StartSong(state StateFlag, song Song) error {
	if state == STATE_IDLE {
		return errors.New("cannot start song with state STATE_IDLE")
	}
	log.Printf("starting song: %s", song.Name)
	swapped := m.change.CompareAndSwap(machineChange{}, machineChange{
		isChange: true,
		state: machineState{
			flag:      state,
			song:      song,
			noteIndex: 0,
		},
	})
	if !swapped {
		return errors.New("machine is busy")
	}
	return nil
}

func (m *Machine) StopSong() error {
	log.Printf("stopping song")
	swapped := m.change.CompareAndSwap(machineChange{}, machineChange{
		isChange: true,
		state: machineState{
			flag: STATE_IDLE,
		},
	})
	if !swapped {
		return errors.New("machine is busy")
	}
	return nil
}

func (m *Machine) tick() error {
	change := m.change.Swap(machineChange{}).(machineChange)

	// First let's handle changes and check that we're actually going to play something.
	if change.isChange {
		m.state = change.state
	}

	if m.state.flag == STATE_IDLE {
		m.tg.Silence(m.idleDuration)
		return nil
	}

	// Next let's work out how the state should be advanced.
	nextNoteIndex := m.state.noteIndex + 1
	if nextNoteIndex >= int(m.state.song.Length) {
		log.Printf("end of song at note index %d", m.state.noteIndex)
		switch m.state.flag {
		case STATE_PLAYING_ONCE:
			m.state.flag = STATE_IDLE
		case STATE_PLAYING_LOOP:
			nextNoteIndex = 0
		default:
			return fmt.Errorf("invalid state: %v", m.state)
		}
	}

	// Advance the state and play the note.
	note := m.state.song.Notes[m.state.noteIndex]
	m.state.noteIndex = nextNoteIndex
	m.playNote(note)
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
	Notes  [255]Note
	Name   string
	Length uint8
}
