#!/bin/bash
#
# Deploy Unified Management Portal with Crash Reporting
#
# Author: Olaolu
# Since: December 2025
#

BUCKET="ledebe"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying unified management portal..."

# Upload portal to S3 from script directory
cd "$SCRIPT_DIR"
aws s3 sync . s3://$BUCKET/management/ --delete --exclude "*.sh"

# Set proper content types
aws s3 cp s3://$BUCKET/management/index.html s3://$BUCKET/management/index.html --content-type "text/html" --metadata-directive REPLACE

echo "✅ Management portal deployed!"
echo "🌐 Portal: http://$BUCKET.s3-website-us-east-1.amazonaws.com/management/"
echo "📊 Overview: http://$BUCKET.s3-website-us-east-1.amazonaws.com/management/#overview"
echo "🚨 Crashes: http://$BUCKET.s3-website-us-east-1.amazonaws.com/management/#crashes"
echo "📈 Analytics: http://$BUCKET.s3-website-us-east-1.amazonaws.com/management/#analytics"