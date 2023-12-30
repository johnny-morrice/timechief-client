#!/bin/bash
set -e
set -x

# Parameters
# BUCKET_NAME
# VERSION
# PRODUCT
# STREAM
# UPLOAD_FILENAME
# BUILD_DIR

if [ -z "$BUCKET_NAME" ] || [ -z "$VERSION" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$UPLOAD_FILENAME" ] || [ -z "$API_BASE_URL" ] ; then
  echo "missing parameters"
  echo "BUCKET_NAME: $BUCKET_NAME"
  echo "VERSION: $VERSION"
  echo "PRODUCT: $PRODUCT"
  echo "STREAM: $STREAM"
  echo "UPLOAD_FILENAME: $UPLOAD_FILENAME"
  echo "API_BASE_URL: $API_BASE_URL"
  exit 1
fi

if [ -z "$BUILD_DIR" ] ; then
  BUILD_DIR=$(mktemp -d)
fi

cp $UPLOAD_FILENAME $BUILD_DIR
pushd $BUILD_DIR
# MY_UPLOAD_FILENAME should be the first .tar.gz file in the build dir
MY_UPLOAD_FILENAME=$(ls *.tar.gz | head -n 1)

SHA256=$(cat $MY_UPLOAD_FILENAME | openssl dgst -binary -sha256 | openssl base64 -A)
URL="https://storage.googleapis.com/$BUCKET_NAME/$MY_UPLOAD_FILENAME"

# type Version struct {
# 	UUID    string
# 	Version string
# 	Product string
# 	Stream  string
# 	URL     string
# 	SHA256  string
# 	Command string
# }

UUID=$(uuidgen)

# Command is the command to run the client and is pretty much always the same for our purposes.
COMMAND=timechief-client-bundle/timechief-launcher
METADATA=$(cat <<EOF
{
  "uuid": "$UUID",
  "version": "$VERSION",
  "product": "$PRODUCT",
  "stream": "$STREAM",
  "command": "$COMMAND",
  "bucket": "$BUCKET_NAME",
  "object": "$MY_UPLOAD_FILENAME",
  "sha256": "$SHA256"
}
EOF
)

echo "Uploading file: $MY_UPLOAD_FILENAME"
gcloud storage cp $MY_UPLOAD_FILENAME gs://$BUCKET_NAME/$MY_UPLOAD_FILENAME
echo "Uploading metadata: $METADATA"
API_URL="$API_BASE_URL"
./script/apicall.sh /version -d "$METADATA" -H "Content-Type: application/json" 
popd
rm -rf $BUILD_DIR