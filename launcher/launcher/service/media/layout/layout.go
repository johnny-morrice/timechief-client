package layout

import (
	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

type Configuration struct {
	Name      string
	MinHeight int
	MaxHeight int
	MinWidth  int
	MaxWidth  int
	Layout    v2.Theme
}

type Criteria struct {
	Width  int
	Height int
}

func (config Configuration) IsSuitable(criteria Criteria) bool {
	if config.MinWidth >= 0 && criteria.Width >= config.MinWidth {
		return false
	}
	if config.MaxWidth >= 0 && criteria.Width <= config.MaxWidth {
		return false
	}
	if config.MinHeight >= 0 && criteria.Height >= config.MinHeight {
		return false
	}
	if config.MaxHeight >= 0 && criteria.Height <= config.MaxHeight {
		return false
	}
	return true
}
