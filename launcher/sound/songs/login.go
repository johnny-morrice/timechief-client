package songs

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
)

func Login() (music.Song, error) {
	song := Song{
		Name: "login",
		Notes: []music.Note{
			// Wiggling around G4
			B3,
			Bb3,
			B3,
			Bb3,
			B3,
			Bb3,
			B3,
			Bb3,
			C4,
			C4,
			C4,
			C4,
			D4,
			D4,
			D4,
			D4,
			E4,
			E4,
			E4,
			E4,
			F4,
			F4,
			F4,
			F4,
			G4,
			G4,
			G4,
			G4,
			Gb4,
			F4,
			Gb4,
			F4,
			Gb4,
			G4,
			Gb4,
			F4,
			Gb4,
			F4,
			Gb4,
			G4,
			A4,
			A4,
			A4,
			A4,
			B4,
			B4,
			B4,
			B4,
			C5,
			C5,
			C5,
			C5,
		},
	}
	return CompileSong(song)
}
