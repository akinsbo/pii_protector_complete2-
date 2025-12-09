#!/bin/bash

BUCKET="ledebe"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE="$SCRIPT_DIR/../pii_protector_website/"

echo "🚀 Deploying website to S3..."
aws s3 sync $SOURCE s3://$BUCKET/ --exclude "downloads/*"

echo "✅ Website deployed!"
REGION=$(aws s3api get-bucket-location --bucket $BUCKET --output text)
if [ "$REGION" = "None" ]; then REGION="us-east-1"; fi
echo "🌐 Visit: http://$BUCKET.s3-website-$REGION.amazonaws.com"
