package video

import (
	"encoding/hex"
	"time"
)

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
	// shaText is output of fmt.Printf("%x", theBytes)
	const shaText = "d6617a009c0c6c9aebf7398d43cad6d1985ddc1b9ab0479e2ea977362b8af5b0"
	sha256, err := hex.DecodeString(shaText)
	if err != nil {
		panic(err)
	}
	return VideoDescriptor{
		UUID:     "fa296dba-d1b5-11ee-81c7-8b87e46806f5",
		Duration: 30 * time.Second,
		Filename: "fa296dba-d1b5-11ee-81c7-8b87e46806f5.mp4",
		URL:      "https://storage.googleapis.com/tc-dev-media-29b00b8a-cf4e-11ee-b66f-63251659d300/file_example_MP4_1920_18MG.mp4",
		SHA256:   sha256,
	}
}
