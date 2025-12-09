#!/bin/bash

BUCKET="ledebe"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

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
