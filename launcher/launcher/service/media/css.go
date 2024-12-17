package media

import (
	"bytes"
	_ "embed"
	"fmt"
	"text/template"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
)

//go:embed template/theme.css
var themeCSS string

//go:embed template/backgroundImage.css
var backgroundImageCSS string

var themeTemplate = template.Must(template.New("theme").Parse(themeCSS))
var backgroundImageTemplate = template.Must(template.New("backgroundImage").Parse(backgroundImageCSS))

func renderThemeCSS(theme v2.Theme) (string, error) {
	buf := bytes.Buffer{}
	err := themeTemplate.Execute(&buf, theme)
	if err != nil {
		return "", fmt.Errorf("failed to render theme: %w", err)
	}
	return buf.String(), nil
}

type backgroundImageCSSParams struct {
	Settings picture.Settings
	Pictures []picture.PictureMetadata
}

func renderBackgroundImageCSS(params backgroundImageCSSParams) (string, error) {
	if !params.Settings.Enabled {
		return "", nil
	}
	if len(params.Pictures) == 0 {
		return "", nil
	}
	buf := bytes.Buffer{}
	err := backgroundImageTemplate.Execute(&buf, params)
	if err != nil {
		return "", fmt.Errorf("failed to render background image: %w", err)
	}
	return buf.String(), nil
}
