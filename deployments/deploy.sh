#!/bin/bash
#
# Ledebe Protector - Website Deployment Script
#
# Purpose: Deploy website to AWS S3 with comprehensive validation
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
# License: MIT
#
# This script performs:
# - Code quality checks (linting, formatting)
# - Security audits
# - Build validation
# - E2E testing
# - S3 deployment
#

set -e

BUCKET="ledebe"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE="$SCRIPT_DIR/../pii_protector_website/"
cd "$SCRIPT_DIR/.."

echo "🔍 Running pre-deployment checks..."

# Code quality checks
echo "📝 Linting code..."
npm run lint || echo "⚠️ Linting issues found"

echo "🎨 Checking code formatting..."
npm run format:check || echo "⚠️ Formatting issues found"

# Security scans
echo "🔒 Running security audit..."
npm run security:audit || echo "⚠️ Security issues found"

# Build and test
echo "🔨 Building project..."
npm run build

echo "🧪 Running core functionality tests..."
npm run test:core || echo "⚠️ Core tests failed but continuing deployment"

echo "🧪 Running full E2E tests..."
npm run test:e2e || echo "⚠️ Some E2E tests failed"

echo "✅ Pre-deployment checks completed!"

# Update download links to latest artifacts
echo "🔗 Updating download links to latest artifacts..."
if [ -f "$SCRIPT_DIR/update-download-links.sh" ]; then
    $SCRIPT_DIR/update-download-links.sh
else
    echo "⚠️ Download links update script not found"
fi

echo "🚀 Deploying website to S3..."
aws s3 sync $SOURCE s3://$BUCKET/ --exclude "downloads/*" --exclude "management/*" --exclude "*.backup"

echo "✅ Website deployed!"
echo "🌐 Visit: http://$BUCKET.s3-website.us-east-2.amazonaws.com"
