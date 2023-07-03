package songs

import (
	"github.com/johnny-morrice/timechief-client/launcher/sound/music"
)

func Shutdown() (music.Song, error) {
	song := Song{
		Name: "shutdown",
		Notes: []music.Note{
			// Wiggling around D4,Eb4,Ab4
			Db4,
			D4,
			Eb4,
			D4,
			Db4,
			D4,
			Eb4,
			D4,
			Db4,
			D4,
			Eb4,
			D4,

			Eb4,
			E4,
			Eb4,
			Db4,
			Eb4,
			E4,
			Eb4,
			Db4,
			Eb4,
			E4,
			Eb4,
			Db4,

			Ab4,
			A4,
			Ab4,
			G4,
			Ab4,
			A4,
			Ab4,
			G4,
			Ab4,
			A4,
			Ab4,
			G4,
		},
	}
	return CompileSong(song)
}
