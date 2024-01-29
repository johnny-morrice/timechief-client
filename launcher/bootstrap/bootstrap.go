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
	Timeout              time.Duration
	FactoryResetCallback func() error
}

func ConsoleBootstrap(opts Options) error {
	if opts.Timeout == 0 {
		return errors.New("timeout cannot be 0")
	}
	m := timerModel{
		timer: timer.NewWithInterval(opts.Timeout, time.Second/10),
		timerKeymap: timerKeymap{
			quit: key.NewBinding(
				key.WithKeys("esc"),
				key.WithHelp("esc", "Continue boot"),
			),
			menu: key.NewBinding(
				key.WithKeys("m"),
				key.WithHelp("m", "Menu"),
			),
		},
		help: help.New(),
		menuModel: menuModel{
			keymap: menuKeymap{
				up: key.NewBinding(
					key.WithKeys("up"),
					key.WithHelp("up", "up"),
				),
				down: key.NewBinding(
					key.WithKeys("down"),
					key.WithHelp("down", "down"),
				),
				enter: key.NewBinding(
					key.WithKeys("enter", "space"),
					key.WithHelp("enter/space", "select"),
				),
			},
			choices: []menuOption{
				{
					label:    "Factory reset",
					callback: opts.FactoryResetCallback,
				},
				{
					label:    "Continue boot",
					callback: func() error { return nil },
				},
			},
		},
	}

	model, err := tea.NewProgram(m).Run()
	if err != nil {
		return err
	}
	menu, isMenu := model.(menuModel)
	if isMenu {
		return menu.choices[menu.cursor].callback()
	}
	return nil
}
