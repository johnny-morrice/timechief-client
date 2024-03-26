#!/bin/bash

TARGET=./launcher/fileserver/static

# Check target exists.
if [ ! -d $TARGET ]; then
    echo "Target directory $TARGET does not exist"
    exit 1
fi

# Delete files in fileserver/static
rm -rf $TARGET/*

# Copy files from ../launcher-web/dist to fileserver/static
cp -r ../launcher-web/dist/* $TARGET/

# Check that files were copied, by checking for existence of index.html
if [ -f "$TARGET/index.html" ]; then
    echo "Web content copied successfully"
else
    echo "Web content copy failed"
    exit 1
fi
