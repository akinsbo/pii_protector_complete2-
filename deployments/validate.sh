#!/bin/bash
#
# Validate Deployment
#

BUCKET="ledebe"

echo "🔍 Validating deployment..."

# Check website
echo "📱 Checking website..."
curl -s -o /dev/null -w "%{http_code}" "http://$BUCKET.s3-website-us-east-1.amazonaws.com" | grep -q "200" && echo "✅ Website accessible" || echo "❌ Website not accessible"

# Check downloads
echo "📦 Checking download files..."
aws s3 ls s3://$BUCKET/downloads/ | grep -q "\.dmg" && echo "✅ macOS installers found" || echo "❌ macOS installers missing"
aws s3 ls s3://$BUCKET/downloads/ | grep -q "\.exe" && echo "✅ Windows installers found" || echo "❌ Windows installers missing"

# Check management portal
echo "🛡️ Checking management portal..."
curl -s -o /dev/null -w "%{http_code}" "http://$BUCKET.s3-website-us-east-1.amazonaws.com/management/" | grep -q "200" && echo "✅ Management portal accessible" || echo "❌ Management portal not accessible"

echo "✅ Validation complete!"