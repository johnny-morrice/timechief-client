# ~/.profile: executed by the command interpreter for login shells.

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
        . "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi

PS1='[\[\e[0;32m\]\u@\h \[\e[0;34m\]\W\[\e[0;00m\]]\$ ';

alias ll='ls -lhF'
alias la='ls -AF'
alias l='ls -CF'
alias s='sudo'
alias sus='sudo -s'

# If the file "not-first-run" does not exist, then run ./firstrun.sh.
# This is a hack to run the firstrun.sh script only once.
# The firstrun.sh script will create the file "not-first-run" and
# then this script will not run it again.
if [ ! -f ./not-first-run ]; then
    ./firstrun.sh
fi

# silent startx on video console

if [[ -z $DISPLAY && $XDG_VTNR -eq 1 ]]; then
  startx > /dev/null 2>&1
  exit
fi
