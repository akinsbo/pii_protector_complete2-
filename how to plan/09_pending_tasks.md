# Ledebe — Pending Tasks

A running list of things not yet done. Check off as completed.

---

## Distribution & App Stores

- [ ] **Apple Mac App Store** — Submit Ledebe desktop app ($99/year Apple Developer Program required). Removes Gatekeeper warning for all Mac users.
- [ ] **Apple Notarisation (outside App Store)** — Notarise the .dmg so it passes Gatekeeper without right-click workaround. Cheaper than full App Store submission.
- [ ] **Microsoft Store** — Submit Windows installer ($19 one-time fee). Removes Windows SmartScreen warning for all Windows users.
- [ ] **Windows Code Signing Certificate** — Purchase an EV code signing cert (~$200–400/year) to sign the .exe. Removes SmartScreen immediately without Microsoft Store.
- [ ] **Linux Snap Store** — Publish .snap to snapcraft.io for easier discovery on Ubuntu.
- [ ] **Homebrew Cask** — Submit a Homebrew cask formula so Mac developers can `brew install --cask ledebe`.

---

## Web & Infrastructure

- [x] **Cloudflare DNS + HTTPS** — ledebe.com live with Cloudflare CDN and SSL.
- [x] **S3 static hosting** — Website hosted on AWS S3 with clean URLs (/downloads/, /docs/, etc.).
- [ ] **app.ledebe.com subdomain** — Set up Cloudflare DNS record pointing to the web app. Currently unverified.
- [ ] **www redirect** — Confirm www.ledebe.com redirects to ledebe.com correctly.
- [ ] **admin@ledebe.com email** — Set up Cloudflare Email Routing to forward to personal Gmail (free).
- [ ] **Domain transfer to Cloudflare** — Transfer ledebe.com from name.com to Cloudflare Registrar (~$10/year, cheaper). Can do after 60-day lock from purchase date.

---

## VS Code Extension

- [x] **Published to VS Code Marketplace** — Publisher: ledebe-demo2, Extension: ledebe-protector-demo.
- [ ] **Update Marketplace listing** — Add screenshots, proper description, categories, tags.
- [ ] **Add AI chat feature** — Let users link their API key and chat directly from VS Code panel (decision pending).
- [ ] **Rename publisher/extension** — ledebe-demo2 is a placeholder name. Consider creating a clean publisher ID.

---

## Marketing & Growth

- [ ] **Social media presence (do this first)** — Create accounts on: Twitter/X (@ledebeapp), LinkedIn (Ledebe Technologies), Instagram (@ledebeapp). Once created, add links back to the website footer.
- [ ] **Product Hunt launch** — Prepare assets: logo, screenshots, tagline, 60-second demo GIF.
- [ ] **Twitter/X account (@ledebeapp)** — Create account, then add link back to website footer.
- [ ] **LinkedIn page** — Good for reaching enterprise/compliance buyers and cybersecurity professionals.
- [ ] **GitHub organisation (ledebeapp)** — Create org, publish any open-source parts, then add link back to website footer.
- [ ] **hello@ledebe.com** — Set up Cloudflare Email Routing so this forwards to personal Gmail. Currently used as the main contact on all pages.
- [ ] **privacy@ledebe.com / legal@ledebe.com / support@ledebe.com** — Set up these sub-addresses once main email is working. Currently all contact points redirect to hello@ledebe.com.
- [ ] **app.ledebe.com subdomain** — Verify this is live and working. Used in "Try Web App" buttons across the site.
- [ ] **Demo video** — Screen recording showing paste → mask → send to ChatGPT flow.
- [ ] **Cybersecurity demo** — Prepare Eleanor Hartley fake document demo for client presentations.

---

## Legal & Business

- [ ] **CAC registration** — Register Ledebe Technologies as a business entity in Nigeria.
- [ ] **Stripe / payment setup** — Set up payment processor for Pro/Team subscriptions.
- [ ] **Privacy Policy & Terms** — Already live on site. Review with a lawyer before charging users.

---

## Website Polish

- [x] **Consistent header across all pages** — Fixed.
- [x] **Clean URLs** — /downloads/, /docs/, /privacy/, /terms/ (no .html).
- [x] **Mobile nav** — Hamburger menu working on small screens.
- [x] **Fixed header on scroll** — Header stays pinned at top.
- [ ] **Verify header fixed on mobile** — Confirm position:fixed works correctly on iOS Safari.
- [ ] **Add real screenshots** — Replace mockup window with actual app screenshots.
- [ ] **Add demo GIF to homepage** — Animated show of the masking in action.
