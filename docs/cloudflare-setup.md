# Free HTTPS Setup with Cloudflare

## Steps:

1. Sign up at https://cloudflare.com (free tier)
2. Add your domain
3. Update nameservers at your domain registrar to Cloudflare's nameservers
4. In Cloudflare DNS settings, add CNAME record:
   - Name: `www` (or `@` for root)
   - Target: `ledebe.s3-website-[region].amazonaws.com`
5. In SSL/TLS settings, set to "Flexible"
6. Done - your site is now on HTTPS

Your S3 bucket stays HTTP, Cloudflare provides free HTTPS.
