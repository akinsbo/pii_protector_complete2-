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
npm run lint

echo "🎨 Checking code formatting..."
npm run format:check

# Security scans
echo "🔒 Running security audit..."
npm run security:audit

# Build and test
echo "🔨 Building project..."
npm run build

echo "🧪 Running E2E tests..."
npm run test:e2e

echo "✅ All checks passed!"

echo "🚀 Deploying website to S3..."
aws s3 sync $SOURCE s3://$BUCKET/ --exclude "downloads/*"

echo "✅ Website deployed!"
REGION=$(aws s3api get-bucket-location --bucket $BUCKET --output text)
if [ "$REGION" = "None" ]; then REGION="us-east-1"; fi
echo "🌐 Visit: http://$BUCKET.s3-website-$REGION.amazonaws.com"
