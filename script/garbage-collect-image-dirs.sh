#!/bin/bash
set -e
set -x

# Parameters
#
# FORCE

FORCE="$1"

# If FORCE is not "--force", then we will not delete the build directory
if [ "$FORCE" != "--force" ] ; then
  echo "apply --force to delete build directories"
  echo "    are you sure you unmounted all the mounts?"
  exit 1
fi


TIDY_NOTE="$HOME/scratch/tidy-images.txt"

# The file TIDY_NOTE contains a list of directories to delete.
# We will delete them one by one.
while read -r line; do
  echo "Deleting $line"
  rm -rf $line
done < $TIDY_NOTE