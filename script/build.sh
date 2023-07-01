#!/bin/bash
set -e
set -x

# Parameters

# PHASE
# VERSION
# IMAGE_OUTPUT
# weatherclock_client_security_apikey
# weatherclock_client_core_baseurl
# BUCKET_NAME
# PRODUCT
# STREAM
# WWW_BASE_URL
# WIDTH
# HEIGHT
# API_BASE_URL
# LAUNCHER_DEVICE_CREDENTIALS
# INSTALL_ROOT

if [ -z "$PHASE" ] ; then
  PHASE="all"
fi

# Vars for building the client bundle
export BUNDLE_OUTPUT=$(mktemp -d)

./script/build-client-bundle.sh

if [ "$PHASE" = "bundle" ] ; then
  exit 0
fi

# Get the output filename, should be a .tar.gz file in BUNDLE_OUTPUT_DIR
export UPLOAD_FILENAME=$(ls $BUNDLE_OUTPUT/*.tar.gz | head -n 1)

./script/upload-version.sh

if [ "$PHASE" = "upload" ] ; then
  exit 0
fi

mkdir -p /opt/timechief-launcher
rm -rf /opt/timechief-launcher/*

./script/initialise-launcher-fs.sh

if [ "$PHASE" = "init-fs" ] ; then
  exit 0
fi

./script/build-image.sh