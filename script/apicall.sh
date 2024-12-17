#!/bin/bash
set -e
set -x

API_PATH=$1
JSON_BODY_FILE=$2

if [ -z "$API_BASE_URL" ] || [ -z "$API_TOKEN" ] || [ -z "$API_PATH" ] ; then
  echo "missing parameters"
  echo "API_BASE_URL: $API_BASE_URL"
  echo "API_TOKEN: $API_TOKEN"
  echo "API_PATH: $API_PATH"
  exit 1
fi

if [ -z "$JSON_BODY_FILE" ] ; then
  curl --fail -X POST -H "Authorization: Bearer $API_TOKEN" "$API_BASE_URL$API_PATH"
  exit 0
fi
JSON_BODY=$(cat $JSON_BODY_FILE)

curl --fail -X POST -H "Authorization: Bearer $API_TOKEN" -d "$JSON_BODY" -H "Content-Type: application/json" "$API_BASE_URL$API_PATH"

