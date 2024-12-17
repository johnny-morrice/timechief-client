package service

import (
	"fmt"

	"github.com/johnny-morrice/timechief-client/launcher/launcher/store"
)

type Version struct {
	UUID    string
	Version string
	Product string
	Stream  string
	SHA256  []byte
	Command string
}

func VersionFromStore(storeVersion store.Version) Version {
	return Version{
		UUID:    storeVersion.UUID,
		Version: storeVersion.Version,
		Product: storeVersion.Product,
		Stream:  storeVersion.Stream,
		SHA256:  storeVersion.SHA256,
		Command: storeVersion.Command,
	}
}

func (v Version) Details() string {
	return fmt.Sprintf("%s %s %s", v.Product, v.Stream, v.Version)
}
