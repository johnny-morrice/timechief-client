#!/bin/bash
set -e
set -x

if [ -z "$IMAGE_OUTPUT" || [ -z "$IMG_PRODUCT" ]  ] ; then
  echo "missing parameters"
  echo "IMAGE_OUTPUT: $IMAGE_OUTPUT"
  echo "IMG_PRODUCT: $IMG_PRODUCT"
  exit 1
fi

pushd $IMAGE_OUTPUT
# Get the first .img file in the output directory
ISO_FILE=$(ls *.img | head -n 1)
export FILENAME="$ISO_FILE"
export FILEPATH="$IMAGE_OUTPUT/$ISO_FILE"
popd
export PRODUCT="$IMG_PRODUCT"
./script/doupload.sh