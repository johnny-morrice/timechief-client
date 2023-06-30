#!/bin/bash
set -e
set -x

# type Version struct {
# 	UUID    string
# 	Version string
# 	Product string
# 	Stream  string
# 	URL     string
# 	SHA256  string
# 	Command string
# }

BUCKET_NAME=$1
VERSION=$2
PRODUCT=$3
STREAM=$4
COMMAND=$5
BUILD_DIR=$6
ELECTRON=$7

UUID=$(uuidgen)

if [ -z "$BUCKET_NAME" ] || [ -z "$VERSION" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$COMMAND" ] || [ -z "$BUILD_DIR" ] ; then
  echo "Usage: $0 <version> <product> <stream> <command> <build-directory> <electron>"
  exit 1
fi

BUNDLE_DIR="$BUILD_DIR/timechief-client-bundle"

rm -rf $BUILD_DIR
# Set up electron
mkdir -p $BUNDLE_DIR

# We will build the client in a temporary directory
TMP_DIR=$(mktemp -d)

# Build electron app
pushd $TMP_DIR
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
    cp -a $TMP_DIR/timechief-client/electron/dist/win-unpacked $BUNDLE_DIR
  else
    cp $TMP_DIR/timechief-client/electron/dist/timechief-client-electron $BUNDLE_DIR
  fi
else
  cp -a $ELECTRON $BUNDLE_DIR
fi

# If the GOOS environment variable is set to "windows" then we copy the powershell hook, otherwise we copy the bash hook
if [ "$GOOS" = "windows" ]; then
  cp $TMP_DIR/timechief-client/launcher/integration-scripts/hook/powershell/timechief-client.ps1 $BUNDLE_DIR
else
  if [ "$STREAM" = "dev" ]; then
    cp -a $TMP_DIR/timechief-client/launcher/integration-scripts/system/mock/bin $BUNDLE_DIR
  else
    cp -a $TMP_DIR/timechief-client/launcher/integration-scripts/system/bin $BUNDLE_DIR
  fi
  cp $TMP_DIR/timechief-client/launcher/integration-scripts/hook/bash/timechief-client $BUNDLE_DIR
  cp $TMP_DIR/timechief-client/launcher/integration-scripts/bootstrap/timechief-bootstrap $BUNDLE_DIR/bin
fi

# Build the python RTC application
pushd $TMP_DIR/timechief-client/rtcutil/pyrtc
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install .
./compile.sh
deactivate
popd

mkdir -p $BUNDLE_DIR/bin/secure
cp $TMP_DIR/timechief-client/rtcutil/pyrtc/dist/pyrtc $BUNDLE_DIR/bin/secure/timechief-pyrtc

# Copy images
cp -a $TMP_DIR/timechief-client/launcher/assets $BUNDLE_DIR

# Build launcher
pushd $TMP_DIR/timechief-client/launcher
mkdir -p bin
go build -o bin/timechief-launcher
popd

if [ "$GOOS" = "windows" ]; then
  cp $TMP_DIR/timechief-client/launcher/bin/timechief-launcher $BUNDLE_DIR/timechief-launcher.exe
else
  cp $TMP_DIR/timechief-client/launcher/bin/timechief-launcher $BUNDLE_DIR/timechief-launcher
fi

rm -rf $TMP_DIR

pushd $BUILD_DIR

FILENAME="timechief-client-bundle.tar.gz"
UNIQUE_NAME="timechief-client-bundle-$(uuidgen).tar.gz"

tar -czf $FILENAME timechief-client-bundle

SHA256=$(cat $FILENAME | openssl dgst -binary -sha256 | openssl base64 -A)
URL="https://storage.googleapis.com/$BUCKET_NAME/$UNIQUE_NAME"

METADATA=$(cat <<EOF
{
  "uuid": "$UUID",
  "version": "$VERSION",
  "product": "$PRODUCT",
  "stream": "$STREAM",
  "command": "$COMMAND",
  "url": "$URL",
  "sha256": "$SHA256"
}
EOF
)

echo "Uploading file: $FILENAME"
gcloud storage cp $FILENAME gs://$BUCKET_NAME/$UNIQUE_NAME
echo "Uploading metadata: $METADATA"
timechief client core version-create --body "$METADATA"
popd