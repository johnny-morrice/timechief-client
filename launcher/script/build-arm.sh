#!/bin/bash
set -e

export GOOS=linux
export GOARCH=arm64
go build -o bin/timechief-launcher-linux-arm64
cp bin/timechief-launcher-linux-arm64 $HOME/go/bin/timechief-launcher-linux-arm64