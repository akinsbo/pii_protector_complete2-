#!/bin/bash

BUCKET="ledebe"

echo "🔒 Setting up CloudFront for HTTPS..."

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --origin-domain-name $BUCKET.s3-website-$(aws s3api get-bucket-location --bucket $BUCKET --output text).amazonaws.com \
  --default-root-object index.html \
  --query 'Distribution.Id' \
  --output text)

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
echo "🌐 HTTPS URL: https://$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)"
echo "⏳ Distribution is deploying (takes ~15 minutes)"
