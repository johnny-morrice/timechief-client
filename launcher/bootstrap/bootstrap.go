package bootstrap

import (
	"errors"
	"time"

	"github.com/charmbracelet/bubbles/help"
	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/timer"
	tea "github.com/charmbracelet/bubbletea"
)

type Options struct {
	Timeout time.Duration
}

func ConsoleBootstrap(opts Options) error {
	if opts.Timeout == 0 {
		return errors.New("timeout cannot be 0")
	}
	m := model{
		timer: timer.NewWithInterval(opts.Timeout, time.Second/10),
		keymap: keymap{
			quit: key.NewBinding(
				key.WithKeys("escape"),
				key.WithHelp("escape", "skip timeout"),
			),
		},
		help: help.New(),
	}

	_, err := tea.NewProgram(m).Run()
	return err
}

type model struct {
	timer    timer.Model
	keymap   keymap
	help     help.Model
	quitting bool
}

type keymap struct {
	quit key.Binding
}

func (m model) Init() tea.Cmd {
	return m.timer.Init()
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case timer.TickMsg:
		var cmd tea.Cmd
		m.timer, cmd = m.timer.Update(msg)
		return m, cmd

	case timer.StartStopMsg:
		var cmd tea.Cmd
		m.timer, cmd = m.timer.Update(msg)
		// m.keymap.stop.SetEnabled(m.timer.Running())
		// m.keymap.start.SetEnabled(!m.timer.Running())
		return m, cmd

	case timer.TimeoutMsg:
		m.quitting = true
		return m, tea.Quit

	case tea.KeyMsg:
		switch {
		case key.Matches(msg, m.keymap.quit):
			m.quitting = true
			return m, tea.Quit
		}
	}

	return m, nil
}

func (m model) helpView() string {
	return "\n" + m.help.ShortHelpView([]key.Binding{
		m.keymap.quit,
	})
}

func (m model) View() string {
	// For a more detailed timer view you could read m.timer.Timeout to get
	// the remaining time as a time.Duration and skip calling m.timer.View()
	// entirely.
	s := m.timer.View()

	if m.timer.Timedout() {
		s = "All done!"
	}
	s += "\n"
	if !m.quitting {
		s = "Exiting in " + s
		s += m.helpView()
	}
	return s
}
