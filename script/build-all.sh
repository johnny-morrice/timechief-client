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
  echo "VERSION: $VERSION"
  echo "IMAGE_OUTPUT: $IMAGE_OUTPUT"
  if [ -z "$weatherclock_client_security_apikey" ] ; then
    echo "weatherclock_client_security_apikey is empty"
  fi
  echo "weatherclock_client_core_baseurl: $weatherclock_client_core_baseurl"
  echo "BUCKET_NAME: $BUCKET_NAME"
  echo "PRODUCT: $PRODUCT"
  echo "STREAM: $STREAM"
  echo "WWW_BASE_URL: $WWW_BASE_URL"
  echo "WIDTH: $WIDTH"
  echo "HEIGHT: $HEIGHT"
  echo "API_BASE_URL: $API_BASE_URL"
  echo "LAUNCHER_DEVICE_CREDENTIALS: $LAUNCHER_DEVICE_CREDENTIALS"
  echo "INSTALL_ROOT: $INSTALL_ROOT"
  exit 1
fi

# Vars for building the client bundle
export BUNDLE_OUTPUT=$(mktemp -d)

./script/build-client-bundle.sh

# Get the output filename, should be a .tar.gz file in BUNDLE_OUTPUT_DIR
export UPLOAD_FILENAME=$(ls $BUNDLE_OUTPUT/*.tar.gz | head -n 1)

./script/upload-version.sh

mkdir -p /opt/timechief-launcher
rm -rf /opt/timechief-launcher/*

./script/initialise-launcher-fs.sh
./script/build-image.sh