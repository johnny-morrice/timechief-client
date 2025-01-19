#!/bin/bash
set -e
set -x

# Parameters
#
# IMAGE_OUTPUT
# BUILD_DIR
set -e

if [ -z "$IMAGE_OUTPUT" ] ; then
  echo "missing parameters"
  echo "IMAGE_OUTPUT: $IMAGE_OUTPUT"
  exit 1
fi

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
cd timechief-client
git checkout $VERSION
sudo apt update
pushd image
./init.sh
sudo ./build.sh

# Get file name of deploy image
DEPLOY_IMAGE=$(ls deploy/*.img | head -n 1)
echo "Found image: $DEPLOY_IMAGE"
# Copy the file to the output location
rm -rf $IMAGE_OUTPUT
mkdir -p $IMAGE_OUTPUT
cp $DEPLOY_IMAGE $IMAGE_OUTPUT/Timechief-$VERSION.img
echo "Copied image to $IMAGE_OUTPUT/Timechief-$VERSION.img"
popd

# TODO tidy up
echo "You need to manually tidy up $BUILD_DIR"
# rm -rf $BUILD_DIR