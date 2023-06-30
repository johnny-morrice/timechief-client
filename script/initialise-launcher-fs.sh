#!/bin/bash
set -e
set -x

# Parameters
# INSTALL_ROOT
# API_BASE_URL
# PRODUCT
# STREAM
# WWW_BASE_URL
# WIDTH
# HEIGHT

if [ -z "$INSTALL_ROOT" ] || [ -z "$API_BASE_URL" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$WWW_BASE_URL" ] || [ -z "$WIDTH" ] || [ -z "$HEIGHT" ] ; then
  echo "Usage: $0 <install-root> <api-base-url> <product> <stream> <www-base-url> <width> <height>"
  exit 1
fi

# TODO delete this when we have fixed in API
if [ -z "$launcher_device_credentials" ]; then 
  echo "launcher_device_credentials env var not set"
  exit 1
fi

LAUNCHER_BIN=$(which timechief-launcher)
FS_LAUNCHER_BIN=$INSTALL_ROOT/bin/timechief-launcher-initial
mkdir -p $INSTALL_ROOT/bin
mkdir -p $INSTALL_ROOT/assets/images
mkdir -p $INSTALL_ROOT/logs/timechief-launcher
mkdir -p $INSTALL_ROOT/logs/timechief-client
rm -rf $FS_LAUNCHER_BIN/*
cp $LAUNCHER_BIN $FS_LAUNCHER_BIN
chmod +x $FS_LAUNCHER_BIN
rm -rf $INSTALL_ROOT/$PRODUCT
rm -f $INSTALL_ROOT/timechief-launcher.db
rm -f $INSTALL_ROOT/timechief-client.log
rm -f $INSTALL_ROOT/timechief-launcher.log

cat <<EOF > $INSTALL_ROOT/client-config.json
{
	"Env": {
		"clockAPIBaseURL": "http://localhost:8080",
		"wwwBaseURL": "$WWW_BASE_URL",
		"timechief_width": "$WIDTH",
		"timechief_height": "$HEIGHT",
		"timechief_fullscreen": "false"
	}
}
EOF

# TODO delete device credentials usage when we have fixed in API
$FS_LAUNCHER_BIN initialise --install-root "$INSTALL_ROOT" --api-base-url "$API_BASE_URL" --product "$PRODUCT" --stream "$STREAM" --device-credentials "$launcher_device_credentials"