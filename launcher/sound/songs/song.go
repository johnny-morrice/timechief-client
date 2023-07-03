package songs

import (
	"errors"

	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
)

type Song struct {
	Name  string
	Notes []music.Note
}

func CompileSong(song Song) (music.Song, error) {
	if len(song.Notes) > 255 {
		return music.Song{}, errors.New("song too long")
	}
	out := music.Song{
		Name:   song.Name,
		Notes:  [255]music.Note{},
		Length: uint8(len(song.Notes)),
	}
	copy(out.Notes[:], song.Notes)
	return out, nil
}

var (
	A3   = music.Note{PWMFreq: 220.00}
	Bb3  = music.Note{PWMFreq: 233.08}
	B3   = music.Note{PWMFreq: 246.94}
	C4   = music.Note{PWMFreq: 261.63}
	C4s  = music.Note{PWMFreq: 277.18}
	Db4  = music.Note{PWMFreq: 277.18}
	D4   = music.Note{PWMFreq: 293.66}
	D4s  = music.Note{PWMFreq: 311.13}
	Eb4  = music.Note{PWMFreq: 311.13}
	E4   = music.Note{PWMFreq: 329.63}
	F4   = music.Note{PWMFreq: 349.23}
	F4s  = music.Note{PWMFreq: 369.99}
	Gb4  = music.Note{PWMFreq: 369.99}
	G4   = music.Note{PWMFreq: 392.00}
	G4s  = music.Note{PWMFreq: 415.30}
	Ab4  = music.Note{PWMFreq: 415.30}
	A4   = music.Note{PWMFreq: 440.00}
	A4s  = music.Note{PWMFreq: 466.16}
	Bb4  = music.Note{PWMFreq: 466.16}
	B4   = music.Note{PWMFreq: 493.88}
	C5   = music.Note{PWMFreq: 523.25}
	C5s  = music.Note{PWMFreq: 554.37}
	Db5  = music.Note{PWMFreq: 554.37}
	D5   = music.Note{PWMFreq: 587.33}
	D5s  = music.Note{PWMFreq: 622.25}
	Eb5  = music.Note{PWMFreq: 622.25}
	E5   = music.Note{PWMFreq: 659.25}
	F5   = music.Note{PWMFreq: 698.46}
	F5s  = music.Note{PWMFreq: 739.99}
	Gb5  = music.Note{PWMFreq: 739.99}
	G5   = music.Note{PWMFreq: 783.99}
	G5s  = music.Note{PWMFreq: 830.61}
	Ab5  = music.Note{PWMFreq: 830.61}
	A5   = music.Note{PWMFreq: 880.00}
	A5s  = music.Note{PWMFreq: 932.33}
	Bb5  = music.Note{PWMFreq: 932.33}
	B5   = music.Note{PWMFreq: 987.77}
	C6   = music.Note{PWMFreq: 1046.50}
	C6s  = music.Note{PWMFreq: 1108.73}
	Db6  = music.Note{PWMFreq: 1108.73}
	D6   = music.Note{PWMFreq: 1174.66}
	D6s  = music.Note{PWMFreq: 1244.51}
	Eb6  = music.Note{PWMFreq: 1244.51}
	E6   = music.Note{PWMFreq: 1318.51}
	F6   = music.Note{PWMFreq: 1396.91}
	F6s  = music.Note{PWMFreq: 1479.98}
	Gb6  = music.Note{PWMFreq: 1479.98}
	G6   = music.Note{PWMFreq: 1567.98}
	G6s  = music.Note{PWMFreq: 1661.22}
	Ab6  = music.Note{PWMFreq: 1661.22}
	A6   = music.Note{PWMFreq: 1760.00}
	A6s  = music.Note{PWMFreq: 1864.66}
	Bb6  = music.Note{PWMFreq: 1864.66}
	B6   = music.Note{PWMFreq: 1975.53}
	C7   = music.Note{PWMFreq: 2093.00}
	C7s  = music.Note{PWMFreq: 2217.46}
	Db7  = music.Note{PWMFreq: 2217.46}
	D7   = music.Note{PWMFreq: 2349.32}
	D7s  = music.Note{PWMFreq: 2489.02}
	Eb7  = music.Note{PWMFreq: 2489.02}
	E7   = music.Note{PWMFreq: 2637.02}
	F7   = music.Note{PWMFreq: 2793.83}
	F7s  = music.Note{PWMFreq: 2959.96}
	Gb7  = music.Note{PWMFreq: 2959.96}
	G7   = music.Note{PWMFreq: 3135.96}
	G7s  = music.Note{PWMFreq: 3322.44}
	Ab7  = music.Note{PWMFreq: 3322.44}
	A7   = music.Note{PWMFreq: 3520.00}
	A7s  = music.Note{PWMFreq: 3729.31}
	Bb7  = music.Note{PWMFreq: 3729.31}
	B7   = music.Note{PWMFreq: 3951.07}
	C8   = music.Note{PWMFreq: 4186.01}
	C8s  = music.Note{PWMFreq: 4434.92}
	Db8  = music.Note{PWMFreq: 4434.92}
	D8   = music.Note{PWMFreq: 4698.63}
	D8s  = music.Note{PWMFreq: 4978.03}
	Eb8  = music.Note{PWMFreq: 4978.03}
	E8   = music.Note{PWMFreq: 5274.04}
	F8   = music.Note{PWMFreq: 5587.65}
	F8s  = music.Note{PWMFreq: 5919.91}
	Gb8  = music.Note{PWMFreq: 5919.91}
	G8   = music.Note{PWMFreq: 6271.93}
	G8s  = music.Note{PWMFreq: 6644.88}
	Ab8  = music.Note{PWMFreq: 6644.88}
	A8   = music.Note{PWMFreq: 7040.00}
	A8s  = music.Note{PWMFreq: 7458.62}
	Bb8  = music.Note{PWMFreq: 7458.62}
	B8   = music.Note{PWMFreq: 7902.13}
	Rest = music.Note{Silence: true}
)
