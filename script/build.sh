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

# PHASE can be one of:
# bundle - build the client bundle and exit
# upload - upload the client bundle and exit
# init-fs - initialise the launcher filesystem and exit
# all - do all of the above and build the image
# Validate this:
if [ "$PHASE" = "bundle" ] || [ "$PHASE" = "upload" ] || [ "$PHASE" = "init-fs" ] || [ "$PHASE" = "all" ] ; then
  echo "PHASE is $PHASE"
else
  echo "PHASE must be one of: bundle, upload, init-fs, all"
  exit 1
fi

# If $1 is set, it's the phase, otherwise use the env var PHASE
if [ -n "$1" ] ; then
  PHASE="$1"
fi


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