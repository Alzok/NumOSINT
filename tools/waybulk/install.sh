#!/bin/sh
set -e

echo "Installing waybulk..."
go install -v github.com/slashformotion/waybulk@latest
echo "waybulk installed successfully."