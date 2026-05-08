# Product Launch Checklist — Full Lifecycle
A complete checklist of everything needed to take a software product from idea to market. Organised by phase.

---

## Phase 1 — Legal & Business Foundation

### Company Registration
- [ ] Search company name availability (CAC — search.cac.gov.ng)✅
- [ ] Choose business structure (Private Limited Company recommended)- ✅
- [ ] Register company on CAC portal (pre-registration + post-registration)✅
- [ ] Pay CAC registration fees ✅
- [ ] Receive Certificate of Incorporation✅
- [ ] Receive Memorandum & Articles of Association (MEMAT)✅
- [ ] Obtain Tax Identification Number (TIN) from FIRS
- [ ] Open a business bank account (Sterling, GTBank, or Providus recommended for fintechs)

### Intellectual Property
- [ ] Trademark the product name (IPOB — Intellectual Property Office Nigeria)
- [ ] Trademark the logo
- [ ] Add copyright notices to all code files and website

---

## Phase 2 — Brand & Identity

### Name & Logo
- [x] Product name decided — Ledebe Protector
- [x] Logo designed
- [ ] Brand guidelines documented (colours, fonts, tone of voice)
- [ ] App icon — 1024×1024 PNG (no transparency)
- [ ] Favicon — 32×32 and 16×16

### Domain & Email
- [x] Domain registered — ledebe.com (name.com → transferred to Cloudflare)
- [x] DNS managed by Cloudflare
- [x] HTTPS live via Cloudflare SSL
- [x] Professional email — hello@ledebe.com (Zoho Mail Lite)
- [ ] Set up email signature in Zoho
- [ ] Set up email aliases: support@, privacy@, legal@ forwarding to hello@
- [ ] Set up out-of-office / auto-reply in Zoho for when unavailable

---

## Phase 3 — Product & Infrastructure

### Hosting & Infrastructure
- [x] Website hosted on AWS S3
- [x] CDN via Cloudflare
- [x] Clean URLs (/downloads/, /docs/, /privacy/, /terms/)
- [ ] Upgrade SSL from Flexible to Full Strict (when moving off S3 to EC2/VPS)
- [ ] Set up staging environment (test changes before going live)
- [ ] Set up uptime monitoring (UptimeRobot free tier — alerts if site goes down)
- [ ] Set up error monitoring (Sentry free tier)

### Web App
- [x] Web app live at app.ledebe.com
- [ ] Verify app.ledebe.com subdomain DNS is correct in Cloudflare
- [ ] Custom 404 error page
- [ ] Cookie consent banner (required for GDPR)

### Desktop App
- [x] Mac (Apple Silicon + Intel) — .dmg and .zip
- [x] Windows — .exe installer
- [x] Linux — AppImage + Snap
- [ ] Auto-updater (notify users when a new version is available)
- [ ] Crash reporting (in place — needs consent dialog for MAS)

### App Store Submission
- [ ] Apple notarisation (removes Gatekeeper warning on Mac)
- [ ] Mac App Store submission ($99/year Apple Developer Program)
- [ ] Microsoft Store submission ($19 one-time fee)
- [ ] Linux Snap Store (snapcraft.io — free)
- [ ] Homebrew Cask formula (for developers on Mac)

---

## Phase 4 — Legal Documents

- [x] Privacy Policy live at ledebe.com/privacy/
- [x] Terms of Service live at ledebe.com/terms/
- [ ] Cookie Policy (separate from Privacy Policy — required for EU)
- [ ] Refund Policy (needed before charging users)
- [ ] Review all legal documents with a lawyer before launching paid tier
- [ ] GDPR compliance check
- [ ] Data Processing Agreement (DPA) template — needed for enterprise/B2B clients

---

## Phase 5 — Pricing & Payments

### Pricing Strategy
- [ ] Define tier structure (Free / Pro / Team / Enterprise)
- [ ] Set pricing per tier (monthly + annual billing)
- [ ] Decide on free trial length (14 days recommended)
- [ ] Define what features are gated behind paid tiers
- [ ] Create pricing page on website

### Payment Infrastructure
- [ ] Register Stripe account (requires business bank account)
- [ ] Connect Stripe to domain (Stripe hosted payment pages or custom integration)
- [ ] Set up subscription billing (monthly + annual)
- [ ] Set up invoice generation
- [ ] Test full payment → subscription → cancellation flow
- [ ] Add VAT/tax handling (Stripe Tax or manual)

---

## Phase 6 — Website & Content

### Website Pages
- [x] Homepage
- [x] Downloads page
- [x] Documentation page
- [x] Privacy Policy page
- [x] Terms of Service page
- [ ] Pricing page
- [ ] Blog (for SEO — write about PII, GDPR, AI data safety)
- [ ] Changelog page (show users what's new in each version)
- [ ] Contact/Support page

### Content
- [ ] Demo video (2-min screen recording of core workflow)
- [ ] Animated GIF of masking in action (for homepage)
- [ ] Real app screenshots (replace mockup window)
- [ ] Case study / demo document (Eleanor Hartley fake PII scenario)
- [ ] Press kit (logo, screenshots, description — for journalists/bloggers)

### SEO
- [ ] Meta titles and descriptions on all pages
- [ ] Open Graph tags (for social sharing previews)
- [ ] Sitemap.xml submitted to Google Search Console
- [ ] robots.txt configured
- [ ] Google Analytics or Plausible Analytics installed

---

## Phase 7 — Social Media & Community

- [ ] Twitter/X account (@ledebeapp)
- [ ] LinkedIn company page (Ledebe)
- [ ] Instagram account (@ledebeapp)
- [ ] GitHub organisation (ledebeapp) — publish open-source parts
- [ ] Add social links to website footer (once accounts are live)
- [ ] Set up Buffer or Hootsuite for scheduled posts (free tier)
- [ ] Create a content calendar (1-2 posts per week minimum)

---

## Phase 8 — Launch & Distribution

### Pre-Launch
- [ ] Build waitlist (email capture on homepage before launch)
- [ ] Prepare Product Hunt launch assets (logo, screenshots, 60-sec GIF, tagline)
- [ ] Identify 10 target communities to post in (Reddit, Hacker News, Indie Hackers, etc.)
- [ ] Write launch post for each platform
- [ ] Prepare 5 beta testers to upvote/comment on launch day

### Launch Day
- [ ] Post on Product Hunt
- [ ] Post on Hacker News (Show HN)
- [ ] Post on Reddit: r/privacy, r/MacApps, r/sysadmin, r/devops, r/SideProject
- [ ] Post on Indie Hackers
- [ ] Email waitlist
- [ ] Post on all social media accounts
- [ ] DM 10 relevant creators/journalists with a personalised pitch

### Post-Launch
- [ ] Respond to every comment and review on launch day
- [ ] Collect feedback and prioritise fixes
- [ ] Write a launch retrospective post (what worked, what didn't)

---

## Phase 9 — Growth & Sales

### Outreach
- [ ] Identify 50 target companies (law firms, hospitals, financial advisors, HR teams)
- [ ] Write a cold email template (personalised, short, demo-led)
- [ ] Reach out to 10 companies per week
- [ ] Follow up after 5 days if no reply
- [ ] Offer a free 30-min demo call (use Calendly)

### Partnerships
- [ ] Reach out to cybersecurity bloggers for reviews
- [ ] Reach out to AI tools (ChatGPT tip sites, AI newsletters) for mentions
- [ ] Partner with GDPR consultants who can recommend Ledebe to clients
- [ ] Explore affiliate programme (pay a % per referral)

### Enterprise
- [ ] Create an enterprise one-pager (PDF) for sales calls
- [ ] Prepare a live demo environment with sample PII documents
- [ ] Define enterprise pricing (custom quotes, annual contracts)
- [ ] Set up a business email thread template for enterprise proposals

---

## Phase 10 — Customer Support & Retention

- [ ] Set up a support inbox in Zoho (hello@ledebe.com)
- [ ] Write FAQ page (top 10 questions users ask)
- [ ] Create onboarding email sequence (welcome → tips → upgrade prompt)
- [ ] Set up NPS survey (ask users to rate Ledebe after 30 days)
- [ ] Monitor reviews on App Store, Product Hunt, G2, Capterra
- [ ] Respond to all reviews (positive and negative)
- [ ] Monthly newsletter to users (product updates, tips)

---

## Phase 11 — Analytics & Monitoring

- [ ] Install analytics (Plausible recommended — privacy-friendly, GDPR compliant)
- [ ] Track: signups, active users, feature usage, churn rate, conversion rate
- [ ] Set up weekly dashboard review (every Monday)
- [ ] A/B test homepage headline and CTA button
- [ ] Track download counts per platform
- [ ] Monitor app store ratings weekly

---

## Status Key
- [x] Done
- [ ] Not yet done
