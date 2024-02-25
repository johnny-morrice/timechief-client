package video

import (
	"time"
)

type VideoSource interface {
	GetVideo() (VideoDescriptor, error)
}

type VideoDescriptor struct {
	UUID     string        `json:"uuid"`
	Filename string        `json:"filename"`
	Duration time.Duration `json:"duration"`
	URL      string        `json:"url"`
}

type StaticVideoSource struct {
	video VideoDescriptor
}

func NewStaticVideoSource(video VideoDescriptor) StaticVideoSource {
	return StaticVideoSource{video: video}
}

func (s StaticVideoSource) GetVideo() (VideoDescriptor, error) {
	return s.video, nil
}

func MakeTestVideo() VideoDescriptor {
	return VideoDescriptor{
		UUID:     "fa296dba-d1b5-11ee-81c7-8b87e46806f5",
		Duration: 30 * time.Second,
		Filename: "fa296dba-d1b5-11ee-81c7-8b87e46806f5.mp4",
		URL:      "https://storage.googleapis.com/tc-dev-media-29b00b8a-cf4e-11ee-b66f-63251659d300/file_example_MP4_1920_18MG.mp4",
	}
}
