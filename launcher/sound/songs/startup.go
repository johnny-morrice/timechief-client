package songs

import "github.com/johnny-morrice/timechief-client/launcher/sound/music"

const (
	C4 = 261.63
	D4 = 293.66
	E4 = 329.63
	F4 = 349.23
	G4 = 392.00
	A4 = 440.00
	B4 = 493.88
	C5 = 523.25
	D5 = 587.33
	E5 = 659.25
	F5 = 698.46
	G5 = 783.99
	A5 = 880.00
	B5 = 987.77
	C6 = 1046.50
	D6 = 1174.66
	E6 = 1318.51
	F6 = 1396.91
	G6 = 1567.98
	A6 = 1760.00
	B6 = 1975.53
)

func StartupTone() music.Song {
	notes := []float32{
		C4, D4, E4, F4, G4, A4, B4,
		C5,
	}
	song := music.Song{
		Name:  "startup",
		Notes: make([]music.Note, 0, len(notes)),
	}
	for _, note := range notes {
		song.Notes = append(song.Notes, music.Note{
			PWMFreq: note,
		})
	}
	return song
}
