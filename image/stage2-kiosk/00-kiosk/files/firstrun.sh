#!/usr/bin/env bash

echo ">> FIRST RUN"

echo
echo ">> Enabling Read-Only Overlay File System"
sudo raspi-config nonint enable_overlayfs
sudo raspi-config nonint enable_bootro

echo
echo ">> Removing First Run Script"
touch not_first_run

echo
echo ">> Rebooting"
sudo reboot
