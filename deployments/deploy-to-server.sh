#!/bin/bash
#
# Ledebe Protector - Server Deployment Script
#
# Purpose: Deploy website to HTTPS server with validation
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
# License: MIT
#
# This script performs:
# - Pre-deployment validation and testing
# - Secure file transfer via rsync
# - Server deployment verification
#

set -e

# Deploy website to your HTTPS server
SERVER="user@your-server-ip"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE="$SCRIPT_DIR/../pii_protector_website/"
cd "$SCRIPT_DIR/.."

echo "🔍 Running pre-deployment validation..."

# Code quality and security checks
echo "📝 Linting code..."
npm run lint

echo "🎨 Checking formatting..."
npm run format:check

echo "🔒 Security audit..."
npm run security:audit

echo "🔨 Building project..."
npm run build

echo "🧪 Running tests..."
npm run test:e2e

echo "✅ All checks passed!"

echo "🚀 Deploying to HTTPS server..."
rsync -avz --delete $SOURCE $SERVER:/var/www/ledebe/

echo "✅ Deployed to server!"
