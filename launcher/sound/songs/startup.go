package songs

import "github.com/johnny-morrice/timechief-client/launcher/sound/music"

const (
	C2 = 65.41
	D2 = 73.42
	E2 = 82.41
	F2 = 87.31
	G2 = 98.00
	A2 = 110.00
	B2 = 123.47
	C3 = 130.81
	D3 = 146.83
	E3 = 164.81
	F3 = 174.61
	G3 = 196.00
	A3 = 220.00
	B3 = 246.94
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
		C2, D2, E2, F2, G2, A2, B2,
		C3, D3, E3, F3, G3, A3, B3,
		C4, D4, E4, F4, G4, A4, B4,
		C5, D5, E5, F5, G5, A5, B5,
		C6, D6, E6, F6, G6, A6, B6,
	}
	song := music.Song{}
	for _, note := range notes {
		song.Notes = append(song.Notes, music.Note{
			PWMFreq: note,
		})
	}
	return song
}
