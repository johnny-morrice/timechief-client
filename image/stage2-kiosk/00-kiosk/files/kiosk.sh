#!/usr/bin/env bash

# never blank the screen
xset s off -dpms

# rotate to portrait mounted TV
# xrandr --output HDMI-1 --rotate left

# show a splash before browser kicks in
feh --bg-scale splash.png

# start the cec-client & browser
/opt/timechief-launcher/bin/timechief-launcher run-client >> /opt/timechief-launcher/timechief-launcher.log 2>&1
