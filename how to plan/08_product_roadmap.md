# Ledebe — Product Roadmap

## Now (Live)
- Web app — protect, restore, AI chat, file upload, custom terms, history
- Desktop app — Mac (Apple Silicon + Intel), Windows, Linux
- VS Code extension — chat-style panel, right-click protect, custom terms, auto-detect PII in files
- Command palette (Cmd+K) history search
- Highlight to protect/unprotect inline
- Dark/light mode
- Multi-language support
- ledebe.com live with HTTPS via Cloudflare (Flexible SSL)
- www.ledebe.com redirects to https://ledebe.com
- DNS managed by Cloudflare (nameservers: norm + paris.ns.cloudflare.com)
- Hosting: AWS S3 bucket ledebe.com (us-east-2), old ledebe bucket deleted
- Future: upgrade SSL to Full Strict when moving from S3 to a proper server (EC2/VPS)

---

## Short Term (1-3 months)

### HTTPS on ledebe.com
- Via Cloudflare — in progress

### VS Code extension — AI Chat
- Users enter their own API key in VS Code settings
- Send masked text directly to OpenAI/Anthropic/Gemini from the extension
- AI replies shown in the chat panel

### Privacy Policy + Terms of Service pages
- Required for app stores, enterprise, and trust

### Demo video on homepage
- 2-minute screen recording showing the core workflow

### Stripe payment integration
- Pro and Team tier subscriptions
- Free trial (14 days) before payment required

---

## Medium Term (3-6 months)

### User accounts
- Sign up / log in
- Sync custom terms across devices
- Usage dashboard

### Team admin dashboard
- Invite team members
- Manage shared custom terms centrally
- See team usage overview

### Browser extension (Chrome / Firefox)
- Works inside ChatGPT, Claude, Gemini, etc.
- Highlights PII in the prompt box before sending
- One-click protect without leaving the AI tool

### Microsoft Store submission
- Remove SmartScreen warning for Windows users
- Increases trust and discoverability

### Product Hunt launch
- Coordinated launch with assets, video, description

---

## Long Term (6-12 months)

### Apple App Store / Notarisation
- Removes Gatekeeper warning on Mac
- Required for serious enterprise adoption

### Audit log
- Enterprise feature — who protected what, when
- Required for compliance reporting

### Compliance reports
- Export a report showing data protection activity
- GDPR / HIPAA evidence for audits

### API
- Developers can integrate Ledebe's masking into their own apps
- Charged per API call — new revenue stream

### Slack / Teams integration
- Protect messages before sending in workplace chat
- High-value enterprise feature

### SSO (Single Sign-On)
- Enterprise requirement — sign in with company Google/Microsoft account

---

## What NOT to Build (Yet)
- AI model training on user data — destroys the trust the product is built on
- Social features — not relevant to this use case
- Mobile app — low priority, most PII leakage happens on desktop
