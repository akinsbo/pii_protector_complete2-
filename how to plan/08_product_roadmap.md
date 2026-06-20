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

## Recently Shipped — June 2026

### Mac App Store submission ✅ (submitted 17 Jun 2026 — in review)
- Apple Developer Program active (Team ID 7HCPW48PVN)
- Bundle ID `com.ledebe.protector` registered
- Mac App Distribution + Mac Installer Distribution certs + WWDR G3 intermediate installed
- Mac App Store provisioning profile created (`build/embedded.provisionprofile`)
- Universal (Apple Silicon + Intel) signed `.pkg` built via `npm run dist:mas` and uploaded via Transporter (build 1.0.1)
- App Store metadata complete: 7 screenshots, description, keywords, Age 4+, Productivity category, Free pricing
- Privacy: crash reporting changed to local-only (no silent transmission) → App Privacy declared "Data Not Collected"
- Export compliance declared (HTTPS-only, exempt) via `ITSAppUsesNonExemptEncryption: false`

### Still pending
- Notarized DMG for direct website download (removes Gatekeeper warning) — needs Developer ID Application cert + notarization
- v1.1: opt-in, sanitized crash telemetry (consent dialog) to regain crash visibility without collecting PII

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
- Mac App Store submission — DONE (submitted 17 Jun 2026, see "Recently Shipped")
- Notarised DMG for website download (Gatekeeper warning) — still pending (needs Developer ID Application cert + notarization)
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
