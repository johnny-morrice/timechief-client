#!/bin/bash

# This script builds a client bundle and prints out its path.

# Parameters
#
# OUTPUT
# BUNDLE_DIR
# BUILD_DIR

# If BUNDLE_DIR is empty, then we will use a temporary directory
if [ -z "$BUNDLE_DIR" ]; then
  BUNDLE_DIR=$(mktemp -d)
fi

# If BUILD_DIR is empty, then we will use a temporary directory
if [ -z "$BUILD_DIR" ]; then
  BUILD_DIR=$(mktemp -d)
fi

mkdir -p $BUNDLE_DIR
mkdir -p $BUILD_DIR
mkdir -p $OUTPUT_DIR

# Build electron app
pushd $BUILD_DIR
git clone https://github.com/johnny-morrice/timechief-client.git
pushd timechief-client
git fetch --tags
git checkout $VERSION
if [ -z "$ELECTRON" ]; then
  pushd electron
  npm install
  npm run dist
  popd
fi
popd
popd

if [ -z "$ELECTRON" ]; then
  if [ "$GOOS" = "windows" ]; then
    cp -a $BUILD_DIR/timechief-client/electron/dist/win-unpacked $BUNDLE_DIR
  else
    cp $BUILD_DIR/timechief-client/electron/dist/timechief-client-electron $BUNDLE_DIR
  fi
else
  cp -a $ELECTRON $BUNDLE_DIR
fi

# If the GOOS environment variable is set to "windows" then we copy the powershell hook, otherwise we copy the bash hook
if [ "$GOOS" = "windows" ]; then
  cp $BUILD_DIR/timechief-client/launcher/integration-scripts/hook/powershell/timechief-client.ps1 $BUNDLE_DIR
else
  if [ "$STREAM" = "dev" ]; then
    cp -a $BUILD_DIR/timechief-client/launcher/integration-scripts/system/mock/bin $BUNDLE_DIR
  else
    cp -a $BUILD_DIR/timechief-client/launcher/integration-scripts/system/bin $BUNDLE_DIR
  fi
  cp $BUILD_DIR/timechief-client/launcher/integration-scripts/hook/bash/timechief-client $BUNDLE_DIR
  cp $BUILD_DIR/timechief-client/launcher/integration-scripts/bootstrap/timechief-bootstrap $BUNDLE_DIR/bin
fi

# Build the python RTC application
pushd $BUILD_DIR/timechief-client/rtcutil/pyrtc
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install .
./compile.sh
deactivate
popd

mkdir -p $BUNDLE_DIR/bin/secure
cp $BUILD_DIR/timechief-client/rtcutil/pyrtc/dist/pyrtc $BUNDLE_DIR/bin/secure/timechief-pyrtc

# Copy images
cp -a $BUILD_DIR/timechief-client/launcher/assets $BUNDLE_DIR

# Build launcher
pushd $BUILD_DIR/timechief-client/launcher
mkdir -p bin
go build -o bin/timechief-launcher
popd

if [ "$GOOS" = "windows" ]; then
  cp $BUILD_DIR/timechief-client/launcher/bin/timechief-launcher $BUNDLE_DIR/timechief-launcher.exe
else
  cp $BUILD_DIR/timechief-client/launcher/bin/timechief-launcher $BUNDLE_DIR/timechief-launcher
fi



pushd $BUNDLE_DIR
UNIQUE_NAME="timechief-client-bundle-$(uuidgen).tar.gz"

tar -czf $UNIQUE_NAME timechief-client-bundle
popd

cp $BUNDLE_DIR/$UNIQUE_NAME $OUTPUT
echo "Copied bundle to $OUTPUT"

rm -rf $BUILD_DIR
rm -rf $BUNDLE_DIR