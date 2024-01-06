#!/bin/bash
set -e
set -x

# This script builds a client bundle and prints out its path.

# Parameters
#
# BUNDLE_OUTPUT
# BUNDLE_DIR
# BUILD_DIR

if [ -z "$VERSION" ] || [ -z "$LAUNCHER_BIN" ] ; then
  echo "missing parameters"
  echo "VERSION: $VERSION"
  echo "LAUNCHER_BIN: $LAUNCHER_BIN"
  exit 1
fi

# If BUNDLE_DIR is empty, then we will use a temporary directory
if [ -z "$BUNDLE_DIR" ] ; then
  BUNDLE_DIR=$(mktemp -d)
fi

# If BUILD_DIR is empty, then we will use a temporary directory
if [ -z "$BUILD_DIR" ] ; then
  BUILD_DIR=$(mktemp -d)
fi

if [ -z "$BUNDLE_OUTPUT" ] ; then
    echo "missing parameters"
    echo "BUNDLE_OUTPUT: $BUNDLE_OUTPUT"
    exit 1
fi

mkdir -p $BUILD_DIR

BUNDLE_UNPACK=$BUNDLE_DIR/timechief-client-bundle
mkdir -p $BUNDLE_UNPACK

# Setup repo
pushd $BUILD_DIR
git clone https://github.com/johnny-morrice/timechief-client.git
pushd timechief-client
git fetch --tags
git checkout $VERSION
popd
popd

# Copy integration scripts
cp -a $BUILD_DIR/timechief-client/launcher/integration-scripts/system/bin $BUNDLE_UNPACK
cp $BUILD_DIR/timechief-client/launcher/integration-scripts/hook/bash/timechief-client $BUNDLE_UNPACK
cp $BUILD_DIR/timechief-client/launcher/integration-scripts/bootstrap/timechief-bootstrap $BUNDLE_UNPACK/bin

# Build launcher
pushd $BUILD_DIR/timechief-client/launcher
mkdir -p bin
go build -o bin/timechief-launcher
cp bin/timechief-launcher $LAUNCHER_BIN
popd

cp $BUILD_DIR/timechief-client/launcher/bin/timechief-launcher $BUNDLE_UNPACK/timechief-launcher

# Build electron app
pushd $BUILD_DIR/timechief-client/electron
  npm install
  npm run dist
popd

cp $BUILD_DIR/timechief-client/electron/dist/timechief-client-electron $BUNDLE_UNPACK

# Build the python RTC application
pushd $BUILD_DIR/timechief-client/rtcutil/pyrtc
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install .
./compile.sh
deactivate
popd

mkdir -p $BUNDLE_UNPACK/bin/secure
cp $BUILD_DIR/timechief-client/rtcutil/pyrtc/dist/pyrtc $BUNDLE_UNPACK/bin/secure/timechief-pyrtc

# Copy images
cp -a $BUILD_DIR/timechief-client/launcher/assets $BUNDLE_UNPACK

pushd $BUNDLE_DIR
UNIQUE_NAME="timechief-client-bundle-$(uuidgen).tar.gz"

tar -czf $UNIQUE_NAME timechief-client-bundle
popd

cp $BUNDLE_DIR/$UNIQUE_NAME $BUNDLE_OUTPUT
echo "Copied bundle to $BUNDLE_OUTPUT"

rm -rf $BUILD_DIR
rm -rf $BUNDLE_DIR