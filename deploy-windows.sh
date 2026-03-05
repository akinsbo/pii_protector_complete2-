#!/bin/bash

# Deploy Windows installer to S3 website
# Usage: ./deploy-windows.sh

set -e

echo "🚀 Deploying Windows installer to website..."

# Configuration
S3_BUCKET="ledebe"
S3_PATH="downloads"
BUILD_DIR="dist-build"
VERSION="1.0.0"

# Files to upload
INSTALLER="${BUILD_DIR}/Ledebe Protector Setup ${VERSION}.exe"
BLOCKMAP="${BUILD_DIR}/Ledebe Protector Setup ${VERSION}.exe.blockmap"

# Check if files exist
if [ ! -f "$INSTALLER" ]; then
    echo "❌ Error: Installer not found at $INSTALLER"
    echo "Run 'npm run dist:win' first"
    exit 1
fi

echo "📦 Found installer: $INSTALLER"

# Upload to S3
echo "⬆️  Uploading to S3..."

aws s3 cp "$INSTALLER" "s3://${S3_BUCKET}/${S3_PATH}/" \
    --content-type "application/x-msdownload" \
    --metadata "version=${VERSION}"

if [ -f "$BLOCKMAP" ]; then
    aws s3 cp "$BLOCKMAP" "s3://${S3_BUCKET}/${S3_PATH}/" \
        --content-type "application/octet-stream"
fi

# Create latest.yml for auto-updates
cat > "${BUILD_DIR}/latest.yml" <<EOF
version: ${VERSION}
files:
  - url: Ledebe Protector Setup ${VERSION}.exe
    sha512: $(shasum -a 512 "$INSTALLER" | awk '{print $1}')
    size: $(stat -f%z "$INSTALLER")
path: Ledebe Protector Setup ${VERSION}.exe
sha512: $(shasum -a 512 "$INSTALLER" | awk '{print $1}')
releaseDate: $(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
EOF

aws s3 cp "${BUILD_DIR}/latest.yml" "s3://${S3_BUCKET}/${S3_PATH}/" \
    --content-type "text/yaml"

# Get download URL
DOWNLOAD_URL="http://${S3_BUCKET}.s3-website.us-east-2.amazonaws.com/${S3_PATH}/Ledebe%20Protector%20Setup%20${VERSION}.exe"

echo ""
echo "✅ Windows installer deployed successfully!"
echo ""
echo "📥 Download URL:"
echo "   $DOWNLOAD_URL"
echo ""
echo "🔗 Add this to your website:"
echo "   <a href=\"$DOWNLOAD_URL\" download>Download for Windows</a>"
echo ""
