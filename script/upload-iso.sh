#!/bin/bash
set -e
set -x

if [ -z "$IMAGE_OUTPUT" ] ; then
  echo "missing parameters"
  echo "IMAGE_OUTPUT: $IMAGE_OUTPUT"
  exit 1
fi

pushd $IMAGE_OUTPUT
# Get the first ISO file in the output directory
ISO_FILE=$(ls *.iso | head -n 1)

export FILENAME="$ISO_FILE"
export FILEPATH="$IMAGE_OUTPUT/$ISO_FILE"
popd
./script/doupload.sh