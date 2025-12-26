#!/bin/bash
#
# Update Website Download Links to Latest Artifacts
#
# Purpose: Automatically update website download links to match latest built artifacts
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="$SCRIPT_DIR/../dist-build"
WEBSITE_DIR="$SCRIPT_DIR/../pii_protector_website"
WEBSITE_FILE="$WEBSITE_DIR/index.html"

echo "🔗 Updating website download links to latest artifacts..."

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run dist:all' first."
    exit 1
fi

# Find latest artifacts
MAC_ARM64_DMG=$(find "$BUILD_DIR" -name "*arm64.dmg" -type f | head -1)
MAC_X64_DMG=$(find "$BUILD_DIR" -name "*x64.dmg" -type f | head -1)
WIN_EXE=$(find "$BUILD_DIR" -name "*.exe" -type f | grep -v "unpacked" | head -1)

# Handle case where no Windows exe found, look for Setup exe specifically
if [ -z "$WIN_EXE" ]; then
    WIN_EXE=$(find "$BUILD_DIR" -name "*Setup*.exe" -type f | head -1)
fi

# Extract just the filenames
if [ -n "$MAC_ARM64_DMG" ]; then
    MAC_ARM64_DMG=$(basename "$MAC_ARM64_DMG")
fi
if [ -n "$MAC_X64_DMG" ]; then
    MAC_X64_DMG=$(basename "$MAC_X64_DMG")
fi
if [ -n "$WIN_EXE" ]; then
    WIN_EXE=$(basename "$WIN_EXE")
fi

echo "📦 Found artifacts:"
echo "  - Mac ARM64: $MAC_ARM64_DMG"
echo "  - Mac x64: $MAC_X64_DMG"
echo "  - Windows: $WIN_EXE"

# Backup original website file
cp "$WEBSITE_FILE" "$WEBSITE_FILE.backup"

# Update download links in website
if [ -n "$MAC_ARM64_DMG" ]; then
    # Update all arm64 DMG references
    sed -i '' "s|downloads/Ledebe Protector-[0-9.]\+-arm64\.dmg|downloads/$MAC_ARM64_DMG|g" "$WEBSITE_FILE"
    echo "✅ Updated Mac ARM64 download link to: $MAC_ARM64_DMG"
fi

if [ -n "$MAC_X64_DMG" ]; then
    # Update all x64 DMG references
    sed -i '' "s|downloads/Ledebe Protector-[0-9.]\+-x64\.dmg|downloads/$MAC_X64_DMG|g" "$WEBSITE_FILE"
    echo "✅ Updated Mac x64 download link to: $MAC_X64_DMG"
fi

if [ -n "$WIN_EXE" ]; then
    # Update all Windows exe references
    sed -i '' "s|downloads/Ledebe Protector Setup [0-9.]\+\.exe|downloads/$WIN_EXE|g" "$WEBSITE_FILE"
    echo "✅ Updated Windows download link to: $WIN_EXE"
fi

echo "🔗 Download links updated successfully!"
echo "📝 Website file: $WEBSITE_FILE"
echo "💾 Backup saved: $WEBSITE_FILE.backup"