#!/bin/bash
set -e
set -x

# Parameters
# FILEPATH
# BUCKET_NAME
# VERSION
# PRODUCT
# STREAM
# FILENAME

if [ -z "$FILEPATH" ] || [ -z "$BUCKET_NAME" ] || [ -z "$VERSION" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$FILENAME" ] ; then
  echo "missing parameters"
  echo "BUCKET_NAME: $BUCKET_NAME"
  echo "VERSION: $VERSION"
  echo "PRODUCT: $PRODUCT"
  echo "STREAM: $STREAM"
  echo "FILENAME: $FILENAME"
  exit 1
fi

# Check if file exists.
if [ ! -f "$FILEPATH" ]; then
  echo "File not found: $FILEPATH"
  exit 1
fi

# Validate filename.
ALLOWED_CHARS="[a-zA-Z0-9._-]"
if [[ ! $FILENAME =~ ^$ALLOWED_CHARS+$ ]]; then
  echo "Invalid filename: $FILENAME"
  echo "Does not match regex: $ALLOWED_CHARS"
  exit 1
fi

SHA256=$(cat $FILEPATH | openssl dgst -binary -sha256 | openssl base64 -A)
URL="https://storage.googleapis.com/$BUCKET_NAME/$FILENAME"

# type Version struct {
# 	UUID    string
# 	Version string
# 	Product string
# 	Stream  string
# 	URL     string
# 	SHA256  string
# 	Command string
# }

UUID=$(uuidgen)
SIZE=$(stat -c %s $FILEPATH)

# Command is the command to run the client and is pretty much always the same for our purposes.
COMMAND=timechief-client-bundle/timechief-launcher
METADATA=$(cat <<EOF
{
  "uuid": "$UUID",
  "version": "$VERSION",
  "product": "$PRODUCT",
  "stream": "$STREAM",
  "command": "$COMMAND",
  "bucket": "$BUCKET_NAME",
  "object": "$FILENAME",
  "sha256": "$SHA256",
  "filename": "$FILENAME",
  "size": $SIZE
}
EOF
)

# Create temporary file:
METADATA_TMPFILE=$(mktemp /tmp/upload.XXXXXXXXXX)
# Write metadata to temporary file:
echo "$METADATA" > $METADATA_TMPFILE

echo "Uploading file: $FILENAME"
gcloud storage cp $FILEPATH gs://$BUCKET_NAME/$FILENAME
echo "Uploading metadata: $METADATA"

./script/apicall.sh /version $METADATA_TMPFILE