package data

import (
	"bytes"
	_ "embed"
	"fmt"
	"text/template"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

//go:embed template/theme.css
var themeCSS string

var themeTemplate = template.Must(template.New("theme").Parse(themeCSS))

func renderCss(theme *v2.Theme) (string, error) {
	buf := bytes.Buffer{}
	err := themeTemplate.Execute(&buf, theme)
	if err != nil {
		return "", fmt.Errorf("failed to render theme: %w", err)
	}
	return buf.String(), nil
}
