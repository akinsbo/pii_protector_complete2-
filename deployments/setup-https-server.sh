#!/bin/bash

# Run this on your EC2 instance (Ubuntu/Debian)
# Prerequisites: Domain pointing to your server's IP

DOMAIN="yourdomain.com"
EMAIL="your@email.com"

# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create web root
sudo mkdir -p /var/www/ledebe

# Configure Nginx
sudo tee /etc/nginx/sites-available/ledebe > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root /var/www/ledebe;
    index index.html;
}
EOF

sudo ln -sf /etc/nginx/sites-available/ledebe /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Get Let's Encrypt certificate (free, auto-renews)
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "✅ HTTPS setup complete! Visit https://$DOMAIN"
