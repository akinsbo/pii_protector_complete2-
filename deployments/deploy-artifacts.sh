#!/bin/bash
#
# Deploy Built Artifacts to S3
#
# Purpose: Upload built application installers to S3 downloads folder
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
#

set -e

BUCKET="ledebe"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="$SCRIPT_DIR/../dist-build"
cd "$SCRIPT_DIR/.."

echo "📦 Deploying available artifacts to S3..."

# Upload any existing artifacts first
if [ -d "$BUILD_DIR" ]; then
    echo "🚀 Uploading existing installers..."
    aws s3 sync "$BUILD_DIR" s3://$BUCKET/downloads/ \
        --exclude "*" \
        --include "*.dmg" \
        --include "*.exe" \
        --include "*.AppImage" \
        --include "*.snap" \
        --include "*.zip" \
        --exclude "*.blockmap" \
        --exclude "*unpacked*"
    
    echo "📋 Current artifacts:"
    find "$BUILD_DIR" -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.snap" | head -10
fi

# Try to build missing artifacts (non-blocking)
echo "🔨 Attempting to build missing artifacts..."

# Build Mac if missing
if [ ! -f "$BUILD_DIR/Ledebe Protector-1.0.0-x64.dmg" ]; then
    echo "📱 Building Intel Mac DMG..."
    npm run build && electron-builder --mac dmg --x64 || echo "⚠️ Mac Intel build failed, continuing..."
fi

# Build Windows separately (may fail due to signing)
echo "🪟 Attempting Windows build..."
COUNT_BEFORE=$(find "$BUILD_DIR" -name "*.exe" 2>/dev/null | wc -l || echo "0")
npm run dist:win || echo "⚠️ Windows build failed due to signing issues"
COUNT_AFTER=$(find "$BUILD_DIR" -name "*.exe" 2>/dev/null | wc -l || echo "0")

if [ "$COUNT_AFTER" -gt "$COUNT_BEFORE" ]; then
    echo "✅ Windows build succeeded, uploading..."
    aws s3 sync "$BUILD_DIR" s3://$BUCKET/downloads/ \
        --exclude "*" \
        --include "*.exe" \
        --exclude "*.blockmap"
else
    echo "⚠️ Windows build blocked by signing - using existing .exe if available"
fi

# Final upload of all available artifacts
echo "🚀 Final sync of all available artifacts..."
aws s3 sync "$BUILD_DIR" s3://$BUCKET/downloads/ \
    --exclude "*" \
    --include "*.dmg" \
    --include "*.exe" \
    --include "*.AppImage" \
    --include "*.snap" \
    --include "*.zip" \
    --exclude "*.blockmap" \
    --exclude "*unpacked*"

echo "✅ Available artifacts deployed!"
echo "🌐 Downloads: http://$BUCKET.s3-website.us-east-2.amazonaws.com/downloads/"

# List uploaded files
echo "📋 Uploaded files:"
aws s3 ls s3://$BUCKET/downloads/ --human-readable --summarize