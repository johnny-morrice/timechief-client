#!/bin/bash

# Delete files in fileserver/static
rm -rf ./fileserver/static/*

# Copy files from ../launcher-web/dist to fileserver/static
cp -r ../launcher-web/dist/* ./fileserver/static/

# Check that files were copied, by checking for existence of index.html
if [ -f ./fileserver/static/index.html ]; then
    echo "Web content copied successfully"
else
    echo "Web content copy failed"
    exit 1
fi
