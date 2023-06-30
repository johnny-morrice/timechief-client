#!/bin/bash
set -e
set -x

# Parameters

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

if [ -z "$VERSION" ] || [ -z "$IMAGE_OUTPUT" ] || [ -z "$weatherclock_client_security_apikey" ] || [ -z "$weatherclock_client_core_baseurl" ] || [ -z "$BUCKET_NAME" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$WWW_BASE_URL" ] || [ -z "$WIDTH" ] || [ -z "$HEIGHT" ] || [ -z "$API_BASE_URL" ] || [ -z "$LAUNCHER_DEVICE_CREDENTIALS" ] || [ -z "$INSTALL_ROOT" ] ; then
  echo "missing parameters"
  exit 1
fi

# Vars for building the client bundle
BUNDLE_OUTPUT_DIR=$(mktemp -d)

# Vars for uploading the client bundle
UPLOAD_FILENAME=$BUNDLE_OUTPUT

./script/build-client-bundle.sh

# Get the output filename, should be a .tar.gz file in BUNDLE__OUTPUT_DIR
BUNDLE_OUTPUT=$(ls $BUNDLE__OUTPUT_DIR/*.tar.gz | head -n 1)

./script/upload-version.sh

mkdir -p /opt/timechief-launcher
rm -rf /opt/timechief-launcher/*

./script/initialise-launcher-fs.sh
./script/build-image.sh