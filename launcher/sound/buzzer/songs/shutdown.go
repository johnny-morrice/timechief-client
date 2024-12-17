package songs

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound/buzzer/music"
)

func Shutdown() (music.Song, error) {
	song := Song{
		Name: "shutdown",
		Notes: []music.Note{
			// Wiggling around G4,E4,C4s,A3
			A4,
			G4s,
			A4,
			Ab4,
			G4,
			G4,
			Rest,
			Rest,
			Rest,
			Rest,
			D4,
			Db4,
			D4,
			Eb4,
			E4,
			E4,
			Rest,
			Rest,
			Rest,
			Rest,
			B3,
			Bb3,
			B3,
			C4,
			C4s,
			C4s,
			Rest,
			Rest,
			Rest,
			Rest,
			C4,
			B3,
			C4,
			B3,
			Bb3,
			A3,
		},
	}
	return CompileSong(song)
}
