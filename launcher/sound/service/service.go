package service

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
	"github.com/johnny-morrice/timechief-client/launcher/sound/songs"
)

type SoundService struct {
	machine  MusicMachine
	songDict map[string]music.Song
}

func NewSoundService(machine MusicMachine) SoundService {
	songs := []music.Song{
		songs.StartupTone(),
	}
	svc := SoundService{
		machine:  machine,
		songDict: map[string]music.Song{},
	}

	for _, song := range songs {
		svc.songDict[song.Name] = song
	}
	return svc
}

func (svc SoundService) StartSong(songOpts SongOptions) error {
	song, ok := svc.songDict[songOpts.SongName]
	if !ok {
		return fmt.Errorf("song not found: %v", songOpts.SongName)
	}
	state := music.STATE_PLAYING_ONCE
	if songOpts.Loop {
		state = music.STATE_PLAYING_LOOP
	}
	return svc.machine.StartSong(state, song)
}

func (svc SoundService) StopSong() error {
	return svc.machine.StopSong()
}

type SongOptions struct {
	SongName string
	Loop     bool
}

type MusicMachine interface {
	StartSong(state music.StateFlag, song music.Song) error
	StopSong() error
}
