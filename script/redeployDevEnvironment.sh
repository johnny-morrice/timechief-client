#!/bin/bash
set -e
set -x
git fetch && git merge origin/main
# sudo reboot