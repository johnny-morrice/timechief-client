package media

import (
	"bytes"
	_ "embed"
	"fmt"
	"text/template"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/media/theme/winning"
	"github.com/johnny-morrice/timechief-client/launcher/launcher/service/picture"
)

//go:embed template/nostro.css
var nostroCSS string

//go:embed template/backgroundImage.css
var backgroundImageCSS string

//go:embed template/winning.css
var winningCSS string

// TODO could use a directory for these templates.
var nostroTemplate = template.Must(template.New("nostro").Parse(nostroCSS))
var backgroundImageTemplate = template.Must(template.New("backgroundImage").Parse(backgroundImageCSS))
var winningTemplate = template.Must(template.New("winning").Parse(winningCSS))

func renderThemeCSS(theme v2.Theme) (string, error) {
	switch theme.SkinName {
	case "nostro":
		return renderNostroTemplate(theme)
	case "winning":
		return renderWinningTemplate(theme)
	default:
		return "", fmt.Errorf("unknown theme skin name: %s", theme.SkinName)
	}
}

func renderWinningTemplate(theme v2.Theme) (string, error) {
	if theme.SkinName != "winning" {
		return "", fmt.Errorf("expected theme skin name to be 'winning' but was '%s'", theme.SkinName)
	}
	buf := bytes.Buffer{}
	templateData, err := winning.MakeWinningTemplateData(theme)
	if err != nil {
		return "", fmt.Errorf("failed to make winning theme template data: %w", err)
	}
	err = winningTemplate.Execute(&buf, templateData)
	if err != nil {
		return "", fmt.Errorf("failed to render winning template: %w", err)
	}
	return buf.String(), nil
}

func renderNostroTemplate(theme v2.Theme) (string, error) {
	if theme.SkinName != "nostro" {
		return "", fmt.Errorf("expected theme skin name to be 'nostro' but was '%s'", theme.SkinName)
	}
	buf := bytes.Buffer{}
	err := nostroTemplate.Execute(&buf, theme)
	if err != nil {
		return "", fmt.Errorf("failed to render nostro template: %w", err)
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
