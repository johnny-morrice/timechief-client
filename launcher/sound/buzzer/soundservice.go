package buzzer

import "github.com/johnny-morrice/timechief-client/launcher/sound/song"

type SoundService interface {
	Initialise() error
	StartSong(songOpts song.Options) error
	StopSong() error
	Finalise() error
}
