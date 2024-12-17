package video

import (
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

type VideoSource interface {
	GetVideo() (VideoDescriptor, error)
}

type VideoDescriptor struct {
	UUID     string        `json:"uuid"`
	Filename string        `json:"filename"`
	Duration time.Duration `json:"duration"`
	URL      string        `json:"url"`
	SHA256   []byte        `json:"sha256"`
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

type DeviceVideoSource struct {
	deviceDataStore DeviceDataStore
}

func MakeDeviceVideoSource(deviceDataStore DeviceDataStore) (DeviceVideoSource, error) {
	if deviceDataStore == nil {
		return DeviceVideoSource{}, errors.New("deviceDataStore is nil")
	}
	return DeviceVideoSource{
		deviceDataStore: deviceDataStore,
	}, nil
}

func (source DeviceVideoSource) GetVideo() (VideoDescriptor, error) {
	deviceData, err := source.deviceDataStore.GetDeviceData()
	if err != nil {
		return VideoDescriptor{}, err
	}
	videoUUID := deviceData.SpookyCampaign.Value.VideoUuid
	if videoUUID == "" {
		return VideoDescriptor{}, nil
	}
	bf, err := getBucketFile(videoUUID, deviceData)
	if err != nil {
		return VideoDescriptor{}, err
	}

	if bf.Metadata.Duration == nil {
		return VideoDescriptor{}, fmt.Errorf("video duration is nil: %v", bf)
	}
	duration := *bf.Metadata.Duration

	if duration == 0 {
		return VideoDescriptor{}, fmt.Errorf("video duration is zero: %v", bf)
	}

	hx, err := hex.DecodeString(bf.Sha256)
	if err != nil {
		return VideoDescriptor{}, fmt.Errorf("failed to decode sha256: %w", err)
	}
	return VideoDescriptor{
		UUID:     videoUUID,
		Filename: bf.Filename,
		Duration: time.Duration(duration) * time.Second,
		URL:      bf.Url,
		SHA256:   hx,
	}, nil
}

func getBucketFile(uuid string, data v2.Data) (v2.BucketFileLink, error) {
	for _, file := range data.BucketFiles.Value.Files {
		if file.Uuid == uuid {
			return file, nil
		}
	}
	return v2.BucketFileLink{}, errors.New("video not found in bucketfile list")
}
