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
export FILEPATH="$BUILD_DIR/$MY_UPLOAD_FILENAME"
export FILENAME="$MY_UPLOAD_FILENAME"
popd
./script/doupload.sh


rm -rf $BUILD_DIR
rm -f $METADATA_TMPFILE