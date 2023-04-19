#!/usr/bin/env bash

# never blank the screen
xset s off -dpms

# rotate to portrait mounted TV
# xrandr --output HDMI-1 --rotate left

# show a splash the app boots
feh --bg-scale /opt/timechief-launcher/assets/images/splash.png

# start timechief
/opt/timechief-launcher/bin/timechief-launcher run-client >> /opt/timechief-launcher/logs/timechief-launcher.log 2>&1
