#!/bin/bash
set -e
set -x

if [ -z "$INSTALL_ROOT" ] || [ -z "$API_BASE_URL" ] || [ -z "$PRODUCT" ] || [ -z "$STREAM" ] || [ -z "$WWW_BASE_URL" ] || [ -z "$WIDTH" ] || [ -z "$HEIGHT" ] || [ -z "$LAUNCHER_BIN" ] || [ -z "$AUTH0_CLIENT_ID" ] || [ -z "$AUTH0_AUDIENCE" ] || [ -z "$AUTH0_BASE_URL" ] ; then
    echo "missing parameters"
	echo "INSTALL_ROOT: $INSTALL_ROOT"
	echo "API_BASE_URL: $API_BASE_URL"
	echo "PRODUCT: $PRODUCT"
	echo "STREAM: $STREAM"
	echo "WWW_BASE_URL: $WWW_BASE_URL"
	echo "WIDTH: $WIDTH"
	echo "HEIGHT: $HEIGHT"
	echo "LAUNCHER_BIN: $LAUNCHER_BIN"
	echo "AUTH0_CLIENT_ID: $AUTH0_CLIENT_ID"
	echo "AUTH0_AUDIENCE: $AUTH0_AUDIENCE"
	echo "AUTH0_BASE_URL: $AUTH0_BASE_URL"
    exit 1
fi

FS_LAUNCHER_BIN=$INSTALL_ROOT/bin/timechief-launcher-initial
mkdir -p $INSTALL_ROOT/bin
mkdir -p $INSTALL_ROOT/assets/images
mkdir -p $INSTALL_ROOT/logs/timechief-launcher
mkdir -p $INSTALL_ROOT/logs/timechief-client
mkdir -p $INSTALL_ROOT/media
mkdir -p $INSTALL_ROOT/credentials
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
		"timechief_fullscreen": "true"
	}
}
EOF

# TODO delete device credentials usage when we have fixed in API
$FS_LAUNCHER_BIN initialise --install-root "$INSTALL_ROOT" --api-base-url "$API_BASE_URL" --product "$PRODUCT" --stream "$STREAM" --auth0-client-id "$AUTH0_CLIENT_ID" --auth0-audience "$AUTH0_AUDIENCE" --auth0-base-url "$AUTH0_BASE_URL"