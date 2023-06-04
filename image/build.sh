#!/usr/bin/env bash

CHECK_FILE=/opt/timechief-launcher/bin/timechief-launcher

# If CHECK_FILE does not exist, exit with error.
if [ ! -f "$CHECK_FILE" ]; then
    echo "File $CHECK_FILE does not exist. Exiting."
    exit 1
fi

# shellcheck disable=SC2164
(cd ./pi-gen; ./build.sh)
