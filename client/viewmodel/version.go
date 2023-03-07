package viewmodel

import (
	"github.com/johnny-morrice/timechief-client/util"
	"github.com/pkg/errors"
)

type Version struct {
	UUID    string
	Version string
	Product string
	Stream  string
	URL     string
	SHA256  string
	Command string
}

type VersionPage struct {
	Page
	Versions []*Version
}

func ValidateVersion(version *Version) error {
	return util.ValidateResource("version", version,
		func(version *Version) error {
			return errors.Wrap(util.ValidateID(version.UUID), "invalid uuid")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateSemver(version.Version), "invalid version")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateShortText(version.Product), "invalid product")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateShortText(version.Stream), "invalid stream")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateURL(version.URL), "invalid url")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateSHA256Text(version.SHA256), "invalid sha256")
		},
		func(version *Version) error {
			return errors.Wrap(util.ValidateShortDataText(version.Command), "invalid command")
		},
	)
}
