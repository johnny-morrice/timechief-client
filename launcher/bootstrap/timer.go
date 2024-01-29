package bootstrap

import (
	"github.com/charmbracelet/bubbles/help"
	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/timer"
	tea "github.com/charmbracelet/bubbletea"
)

type timerModel struct {
	timer       timer.Model
	timerKeymap timerKeymap
	help        help.Model
	quitting    bool
	menuModel   tea.Model
}

type timerKeymap struct {
	quit key.Binding
	menu key.Binding
}

func (m timerModel) Init() tea.Cmd {
	return m.timer.Init()
}

func (m timerModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
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
		case key.Matches(msg, m.timerKeymap.quit):
			m.quitting = true
			return m, tea.Quit
		case key.Matches(msg, m.timerKeymap.menu):
			return m.menuModel, nil
		}
	}

	return m, nil
}

func (m timerModel) helpView() string {
	return "\n" + m.help.FullHelpView([][]key.Binding{
		{m.timerKeymap.quit},
	})
}

func (m timerModel) View() string {
	// For a more detailed timer view you could read m.timer.Timeout to get
	// the remaining time as a time.Duration and skip calling m.timer.View()
	// entirely.
	s := m.timer.View()

	if m.timer.Timedout() || m.quitting {
		s = "Welcome to Timechief"
	}

	s += "\n"
	if !m.quitting {
		s = "Launching Timechief in " + s + "\n"
		s += m.helpView()
	}

	return s
}
