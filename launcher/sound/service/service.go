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

func loadSongs() ([]music.Song, error) {
	songsFactories := []func() (music.Song, error){
		songs.StartupTone,
	}

	songs := []music.Song{}
	for _, factory := range songsFactories {
		song, err := factory()
		if err != nil {
			return nil, err
		}
		songs = append(songs, song)
	}
	return songs, nil
}

func NewSoundService(machine MusicMachine) (SoundService, error) {
	songs, err := loadSongs()
	if err != nil {
		return SoundService{}, err
	}
	svc := SoundService{
		machine:  machine,
		songDict: map[string]music.Song{},
	}

	for _, song := range songs {
		svc.songDict[song.Name] = song
	}
	return svc, nil
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
