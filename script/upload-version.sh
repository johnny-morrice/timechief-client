#!/bin/bash
set -e
set -x

# Parameters
# BUCKET_NAME
# VERSION
# PRODUCT
# STREAM
# UPLOAD_FILENAME

if [ -z "$BUCKET_NAME" ] || [ -z "$VERSION" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$UPLOAD_FILENAME" ] ; then
  echo "missing parameters"
  exit 1
fi

SHA256=$(cat $UPLOAD_FILENAME | openssl dgst -binary -sha256 | openssl base64 -A)
URL="https://storage.googleapis.com/$BUCKET_NAME/$UPLOAD_FILENAME"

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

# Command is the command to run the client and is pretty much always the same for our purposes.
COMMAND=timechief-client-bundle/timechief-launcher
METADATA=$(cat <<EOF
{
  "uuid": "$UUID",
  "version": "$VERSION",
  "product": "$PRODUCT",
  "stream": "$STREAM",
  "command": "$COMMAND",
  "url": "$URL",
  "sha256": "$SHA256"
}
EOF
)

echo "Uploading file: $UPLOAD_FILENAME"
gcloud storage cp $UPLOAD_FILENAME gs://$BUCKET_NAME/$UNIQUE_NAME
echo "Uploading metadata: $METADATA"
timechief client core version-create --body "$METADATA"
popd