#!/bin/bash
set -e
set -x

TIDY_NOTE="$HOME/scratch/tidy-images.txt"

# The file TIDY_NOTE contains a list of directories to delete.
# We will delete them one by one.
while read -r line; do
  echo "Deleting $line"
  rm -rf $line
done < $TIDY_NOTE