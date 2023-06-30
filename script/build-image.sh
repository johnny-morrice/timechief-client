#!/bin/bash

# Parameters
#
# IMAGE_OUTPUT
# BUILD_DIR
set -e

# If BUILD_DIR is empty, then we will use a temporary directory
if [ -z "$BUILD_DIR" ]; then
  BUILD_DIR=$(mktemp -d)
fi

pushd $BUILD_DIR
git clone https://github.com/johnny-morrice/timechief-client.git
pushd image
./init.sh
sudo ./build.sh

# Get file name of deploy image
DEPLOY_IMAGE=$(ls deploy/*.img | head -n 1)
echo "Deploy image: $DEPLOY_IMAGE"
# Copy the file to the output location
cp $DEPLOY_IMAGE $IMAGE_OUTPUT
popd