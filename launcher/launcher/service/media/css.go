package media

import (
	"bytes"
	_ "embed"
	"fmt"
	"log"
	"text/template"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
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
	templatesBySkinName := map[string]*template.Template{
		"nostro":  nostroTemplate,
		"winning": winningTemplate,
	}
	template, ok := templatesBySkinName[theme.SkinName]
	if !ok {
		// Render nostro skin by default
		log.Printf("unknown skin name %q, falling back to nostro", theme.SkinName)
		template = nostroTemplate
	}
	buf := bytes.Buffer{}
	err := template.Execute(&buf, theme)
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
