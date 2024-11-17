package pipewire

import (
	"fmt"
	"log"
	"os/exec"
	"path"
	"path/filepath"

	"github.com/johnny-morrice/timechief-client/launcher/sound/song"
)

type Service struct {
	volume      string
	songChan    chan song.Options
	installRoot string
}

func MakeSoundService(installRoot string, volume float64) (Service, error) {
	if volume < 0 || volume > 1 {
		return Service{}, fmt.Errorf("invalid volume")
	}

	volumeText := fmt.Sprintf("%.1f", volume)
	svc := Service{
		volume:      volumeText,
		songChan:    make(chan song.Options),
		installRoot: installRoot,
	}
	return svc, nil
}

func (svc Service) Initialise() error {
	checkFile := path.Join(svc.installRoot, "pipewire-setup-done")
	err := svc.runScript("timechief-pipewire-initialise", checkFile, svc.volume)
	if err != nil {
		return err
	}
	go func() {
		for songOpt := range svc.songChan {
			err := svc.playSong(songOpt)
			if err != nil {
				log.Printf("error playing song: %s", err)
			}
		}
	}()
	return nil
}

func (svc Service) StartSong(songOpts song.Options) error {
	go func() {
		svc.songChan <- songOpts
	}()
	return nil

}

func (svc Service) playSong(songOpts song.Options) error {
	soundFiles := map[string]string{
		"startup":  "startup.wav",
		"login":    "login.wav",
		"shutdown": "shutdown.wav",
	}
	soundFileName, ok := soundFiles[songOpts.SongName]
	if !ok {
		return fmt.Errorf("no such song: %s", songOpts.SongName)
	}
	soundFilePath := path.Join(svc.installRoot, "assets/sound", soundFileName)
	err := svc.runScript("timechief-pipewire-play-file", soundFilePath)
	if err != nil {
		return fmt.Errorf("error playing file %s for song %s: %w", soundFilePath, songOpts.SongName, err)
	}
	return nil
}

func (svc Service) StopSong() error {
	// TODO not implemented
	return nil
}

func (svc Service) Finalise() error {
	return nil
}

func (svc Service) runScript(path string, args ...string) error {
	binRoot := filepath.Join(svc.installRoot, "bin")
	script := filepath.Join(binRoot, path)
	args = append([]string{script}, args...)
	cmd := exec.Cmd{
		Path: script,
		Dir:  binRoot,
		Args: args,
	}

	output, err := cmd.CombinedOutput()
	log.Printf("sound daemon script %s output: %s", script, output)
	if err != nil {
		return fmt.Errorf("failed to execute sound daemon script %s: %w", path, err)
	}
	return nil
}
