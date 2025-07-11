#!/bin/sh
set -e

echo "Installing wau..."
go install -v github.com/alpkeskin/wau@latest
echo "wau installed successfully."