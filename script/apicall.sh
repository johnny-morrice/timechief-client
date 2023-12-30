#!/bin/bash
set -e

API_PATH=$1
API_EXTRA=$2

if [ -z "$API_BASE_URL" ] || [ -z "$API_TOKEN"] || [ -z "$API_PATH" ] ; then
  echo "missing parameters"
  echo "API_BASE_URL: $API_BASE_URL"
  echo "API_TOKEN: $API_TOKEN"
  echo "API_PATH: $API_PATH"
  exit 1
fi

curl --fail -X POST -H "Authorization: Bearer $API_TOKEN" $API_EXTRA "$API_BASE_URL/$API_PATH"