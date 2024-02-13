package data

import (
	"math/rand"

	v2 "github.com/johnny-morrice/timechief-client/launcher/launcher/client/timechief/v2"
)

// randomTheme returns a random theme and is intended for testing.
func randomTheme() *v2.Theme {
	i := randomColorIndex()
	bg := backgroundColor(i)
	boxBg := boxBackgroundColor(i)
	buttonBg := buttonBackgroundColor(i)
	fg := foregroundColor(i)
	radius := randomBoxRadius()
	borderWidth := boxBorderWidth()
	timeFont := "Seven Segment"
	mainFont := randomFont()
	return &v2.Theme{
		ForegroundColor:       &fg,
		BackgroundColor:       &bg,
		BoxBackgroundColor:    &boxBg,
		ButtonBackgroundColor: &buttonBg,
		BoxBorderRadius:       &radius,
		BoxBorderWidth:        &borderWidth,
		TimeFont:              &timeFont,
		MainFont:              &mainFont,
	}
}

func randomFont() string {
	return randomChoice("Titillium Web", "sans-serif", "serif", "monospace", "cursive")

}

func boxBorderWidth() string {
	return randomChoice("1px", "2px", "3px", "4px")
}

func randomBoxRadius() string {
	return randomChoice("0", "5px", "10px", "15px")
}

var colorThemes = [][]string{
	{"#648767", "#7DC95E", "#CEE7E6"},
	{"#5C6B73", "#9DB4C0", "#E0FBFC"},
	{"#1B2021", "#A6A867", "#E3DCC2"},
	{"#001D4A", "#006992", "#EAF8BF"},
}

func randomColorIndex() int {
	return rand.Int() % len(colorThemes)
}

func foregroundColor(i int) string {
	return colorThemes[i][2]
}

func backgroundColor(i int) string {
	return colorThemes[i][0]
}

func boxBackgroundColor(i int) string {
	return colorThemes[i][1]
}

func buttonBackgroundColor(i int) string {
	return colorThemes[i][1]
}

func randomChoice[T any](choices ...T) T {
	index := rand.Int() % len(choices)
	return choices[index]
}
