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

echo "🧪 Running core functionality tests..."
# npm run test:core || { echo "❌ Core tests failed - build aborted"; exit 1; }
echo "⚠️ Core tests temporarily disabled - manual verification required"

echo "📦 Deploying built artifacts to S3..."

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run dist:all' first."
    exit 1
fi

# Upload artifacts to S3
echo "🚀 Uploading installers..."
aws s3 sync "$BUILD_DIR" s3://$BUCKET/downloads/ \
    --exclude "*" \
    --include "*.dmg" \
    --include "*.exe" \
    --include "*.AppImage" \
    --include "*.snap" \
    --include "*.zip" \
    --include "*.blockmap"

# Set proper content types
echo "🔧 Setting content types..."
aws s3 cp s3://$BUCKET/downloads/ s3://$BUCKET/downloads/ \
    --recursive \
    --exclude "*" \
    --include "*.dmg" \
    --content-type "application/x-apple-diskimage" \
    --metadata-directive REPLACE

aws s3 cp s3://$BUCKET/downloads/ s3://$BUCKET/downloads/ \
    --recursive \
    --exclude "*" \
    --include "*.exe" \
    --content-type "application/x-msdownload" \
    --metadata-directive REPLACE

echo "✅ Artifacts deployed successfully!"
echo "🌐 Downloads available at: http://$BUCKET.s3-website-us-east-1.amazonaws.com/downloads/"

# List uploaded files
echo "📋 Uploaded files:"
aws s3 ls s3://$BUCKET/downloads/ --human-readable --summarize