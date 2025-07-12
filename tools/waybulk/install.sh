#!/bin/sh
echo "--- Installing waybulk (Python tool) ---"

# Install Python dependencies
pip3 install requests

# Make the script executable
chmod +x /app/tools/waybulk/waybulk.py

# Create a symlink to make it available in the PATH
ln -sf /app/tools/waybulk/waybulk.py /usr/local/bin/waybulk

echo "✅ waybulk installed."