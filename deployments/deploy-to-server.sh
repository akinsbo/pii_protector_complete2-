#!/bin/bash

# Deploy website to your HTTPS server
SERVER="user@your-server-ip"
SOURCE="../pii_protector_website/"

echo "🚀 Deploying to HTTPS server..."
rsync -avz --delete $SOURCE $SERVER:/var/www/ledebe/

echo "✅ Deployed!"
