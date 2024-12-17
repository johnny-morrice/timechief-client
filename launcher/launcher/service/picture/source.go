package picture

import (
	"encoding/hex"
	"errors"
	"fmt"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
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

type DevicePictureSource struct {
	deviceDataStore DeviceDataStore
}

func MakeDevicePictureSource(deviceDataStore DeviceDataStore) (DevicePictureSource, error) {
	if deviceDataStore == nil {
		return DevicePictureSource{}, errors.New("deviceDataStore is nil")
	}
	return DevicePictureSource{
		deviceDataStore: deviceDataStore,
	}, nil
}

type DeviceDataStore interface {
	GetDeviceData() (v2.Data, error)
}

func (src DevicePictureSource) GetPicture() (PictureDescriptor, error) {
	deviceData, err := src.deviceDataStore.GetDeviceData()
	if err != nil {
		return PictureDescriptor{}, err
	}
	// TODO support more than one picture eventually.
	if len(deviceData.DeviceProfile.Value.Theme.ImageUuids) == 0 {
		return PictureDescriptor{}, nil
	}
	// TODO where do we support these options?
	if deviceData.DeviceProfile.Value.Theme.ImageFit != "cover" {
		return PictureDescriptor{}, errors.New("unsupported image fit")
	}
	pictureUUID := deviceData.DeviceProfile.Value.Theme.ImageUuids[0]
	if pictureUUID == "" {
		return PictureDescriptor{}, nil
	}
	bf, err := getBucketFile(pictureUUID, deviceData)
	if err != nil {
		return PictureDescriptor{}, err
	}

	hx, err := hex.DecodeString(bf.Sha256)
	if err != nil {
		return PictureDescriptor{}, fmt.Errorf("failed to decode sha256: %w", err)
	}

	return PictureDescriptor{
		UUID:     pictureUUID,
		Filename: bf.Filename,
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
