#!/usr/bin/env bash

## clone pi-gen
git clone --depth 1 --branch arm64 https://github.com/RPI-Distro/pi-gen.git

## TODO fix build
pushd pi-gen
git checkout 05a772481a892663bc8974b72ae50aab684e92bb 
popd

## disable export for stage2
touch ./pi-gen/stage2/SKIP_IMAGES ./pi-gen/stage2/SKIP_NOOBS

## link config
ln -s ../config ./pi-gen

## link stage2-kiosk
ln -s ../stage2-kiosk ./pi-gen

## link future deploys
[[ ! -d ./pi-gen/deploy ]] && mkdir ./pi-gen/deploy
ln -s ./pi-gen/deploy .
