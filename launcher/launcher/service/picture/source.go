package picture

import (
	"encoding/hex"
)

type PictureSource interface {
	GetPicture() (PictureDescriptor, error)
}

type PictureDescriptor struct {
	UUID     string `json:"uuid"`
	Filename string `json:"filename"`
	URL      string `json:"url"`
	SHA256   []byte `json:"sha256"`
}

type StaticVideoSource struct {
	picture PictureDescriptor
}

func NewStaticPictureSource(picture PictureDescriptor) StaticVideoSource {
	return StaticVideoSource{picture: picture}
}

func (s StaticVideoSource) GetPicture() (PictureDescriptor, error) {
	return s.picture, nil
}

func MakeTestPicture() PictureDescriptor {
	// shaText is output of fmt.Printf("%x", theBytes)
	const shaText = ""
	sha256, err := hex.DecodeString(shaText)
	if err != nil {
		panic(err)
	}
	return PictureDescriptor{
		UUID:     "076cd234-d74f-11ee-aed2-776b2976eb9d",
		Filename: "076cd234-d74f-11ee-aed2-776b2976eb9d.png",
		URL:      "https://storage.googleapis.com/tc-dev-media-29b00b8a-cf4e-11ee-b66f-63251659d300/synthwave-retrowave-waves-sun-sky.jpg",
		SHA256:   sha256,
	}
}
