#!/bin/bash
set -e

go build -o bin/timechief-launcher
cp bin/timechief-launcher $HOME/go/bin/timechief-launcher