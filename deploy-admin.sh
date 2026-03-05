#!/bin/bash

# Deploy Admin Portal to S3
# Usage: ./deploy-admin.sh [institution-name]

INSTITUTION=${1:-acme}
BUCKET="ledebe"
REGION="us-east-2"

echo "🚀 Deploying admin portal for: $INSTITUTION"

# Upload to S3
aws s3 cp admin-portal/$INSTITUTION/admin/index.html s3://$BUCKET/$INSTITUTION/admin/index.html \
    --region $REGION \
    --content-type "text/html" \
    --acl public-read

echo "✅ Deployed successfully!"
echo "🌐 Access at: http://$BUCKET.s3-website.$REGION.amazonaws.com/$INSTITUTION/admin"
