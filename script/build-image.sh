#!/bin/bash
set -e
set -x

# Parameters
#
# IMAGE_OUTPUT
# BUILD_DIR
set -e

# If BUILD_DIR is empty, then we will use a temporary directory
if [ -z "$BUILD_DIR" ]; then
  BUILD_DIR=$(mktemp -d)
fi

# We cannot at this moment easily tidy up the build directory so let's note where they are and we can have a process garbage collect them.
mkdir -p $HOME/scratch
TIDY_NOTE="$HOME/scratch/tidy-images.txt"
echo $BUILD_DIR >> $TIDY_NOTE

pushd $BUILD_DIR
git clone https://github.com/johnny-morrice/timechief-client.git
git checkout $VERSION
pushd image
./init.sh
sudo ./build.sh

# Get file name of deploy image
DEPLOY_IMAGE=$(ls deploy/*.img | head -n 1)
echo "Deploy image: $DEPLOY_IMAGE"
# Copy the file to the output location
cp $DEPLOY_IMAGE $IMAGE_OUTPUT
popd