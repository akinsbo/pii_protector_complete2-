#!/bin/bash
#
# Ledebe Protector - Artifact Build & Deployment Script
#
# Purpose: Build and deploy desktop application artifacts
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
# License: MIT
#
# This script performs:
# - Comprehensive pre-build validation
# - Cross-platform artifact building (macOS, Windows)
# - S3 artifact deployment
# - Download link generation
#

set -e

BUCKET="ledebe"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "🔍 Running comprehensive pre-build checks..."

# Run all quality and security checks
echo "📝 Running linting..."
npm run lint

echo "🎨 Checking code formatting..."
npm run format:check

echo "🔒 Running security audit..."
npm run security:audit

echo "🧪 Running E2E tests..."
npm run test:e2e

echo "✅ All checks passed! Building artifacts..."

echo "🔨 Building Mac artifact..."
npm run dist:mac

echo "🔨 Building Windows artifact..."
npm run build && npx electron-builder --win

echo "📦 Uploading artifacts to S3..."
if [ -f "dist-build/pii-protector-1.0.0-arm64.dmg" ]; then
    aws s3 cp dist-build/pii-protector-1.0.0-arm64.dmg s3://$BUCKET/downloads/ledebe-1.0.0-arm64.dmg
else
    echo "⚠️  Mac DMG not found"
fi

if ls dist-build/*.exe 1> /dev/null 2>&1; then
    EXE_FILE=$(ls dist-build/*.exe | head -n 1)
    aws s3 cp "$EXE_FILE" s3://$BUCKET/downloads/ledebe-1.0.0.exe
else
    echo "⚠️  Windows EXE not found"
fi

echo "✅ Artifacts deployed!"
REGION=$(aws s3api get-bucket-location --bucket $BUCKET --output text)
if [ "$REGION" = "None" ]; then REGION="us-east-1"; fi
echo "🔗 Mac: http://$BUCKET.s3-website-$REGION.amazonaws.com/downloads/ledebe-1.0.0-arm64.dmg"
echo "🔗 Windows: http://$BUCKET.s3-website-$REGION.amazonaws.com/downloads/ledebe-1.0.0.exe"
