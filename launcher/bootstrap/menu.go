package bootstrap

import (
	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
)

type menuModel struct {
	keymap  menuKeymap
	choices []menuOption
	cursor  int
}

type menuOption struct {
	label      string
	isSelected bool
	callback   func() error
}

func (m menuModel) Init() tea.Cmd {
	return nil
}

func (m menuModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:

		switch {

		case key.Matches(msg, m.keymap.up):
			if m.cursor > 0 {
				m.cursor--
			}

		case key.Matches(msg, m.keymap.down):
			if m.cursor < len(m.choices)-1 {
				m.cursor++
			}

		// The "enter" key and the spacebar (a literal space) toggle
		// the selected state for the item that the cursor is pointing at.
		case key.Matches(msg, m.keymap.enter):
			for i := range m.choices {
				if i == m.cursor {
					m.choices[i].isSelected = true
				}
			}
			return m, tea.Quit
		}
	}

	// Return the updated model to the Bubble Tea runtime for processing.
	// Note that we're not returning a command.
	return m, nil
}

func (m menuModel) View() string {
	s := "Timechief boot menu\n\n"
	s += "Select an option:\n\n"
	for i, choice := range m.choices {
		cursor := " "
		if i == m.cursor {
			cursor = ">"
		}
		s += cursor + " " + choice.label + "\n"
	}
	return s
}

type menuKeymap struct {
	up    key.Binding
	down  key.Binding
	enter key.Binding
}
