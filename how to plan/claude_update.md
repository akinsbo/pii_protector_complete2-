# Ledebe Protector — Session Update

Summary of everything done across the recent working sessions. Hand this to a teammate and they should understand what changed in the repo, where the Microsoft Store launch stands, what the website now looks like, and what's left to do.

## Quick orientation — read this first

**Where things stand right now (end of May 2026):**

1. **Ledebe Protector is live on the Microsoft Store** — https://apps.microsoft.com/detail/9N6HCR9DSLPT. Free download. Paid tiers are sold inside the app, not through Microsoft commerce.
2. **The website (ledebe.com) is now fully multilingual** across English, Spanish, French, Arabic, Chinese. Every user-facing page works — pricing, downloads, demo, contact, about, docs, privacy, terms. Arabic also flips to RTL. **All deployed and live.**
3. **A round of "vaporware" cleanup happened**: the misleading "Try the Web App — No Install Needed" card on downloads, the "Try Web App Free →" button on the homepage, and a few related claims were removed because `app.ledebe.com` either doesn't exist or doesn't work as advertised.
4. **A wider audit of unverified product claims was delivered** (Snap package, VS Code Marketplace listing, Calendly demo booking, Paddle integration, AI chat with own API key, document/PDF upload, OCR, Company Sync, Admin dashboard, Audit log, On-premise, HIPAA) — **none acted on yet**. The user needs to confirm which are real before another cleanup pass.
5. **All website translation work is uncommitted on `PlayWithQ`** and was deployed straight from working tree to S3. The diff against `origin/PlayWithQ` is everything described in the "Session: Multilingual website + misleading-claim cleanup" section further down.
6. **A new `ledebe-browser-extension/` directory now exists** at the repo root (untracked) with a manifest, content script, popup, detector, and CSS. The downloads page has an "extension-card" style block and a "Browser Extension Preview" section added. **This work is separate from the translation/cleanup session and is not deployed.** Treat it as in-progress new product work to evaluate separately.
7. **The VS Code extension now has a working Chat tab** (v0.1.2, installed locally May 2026). Users can chat with OpenAI / Anthropic / Gemini directly from the activity-bar panel — messages are PII-masked before leaving the machine and unmasked in the reply. This makes the API-key feature (which was previously stored-but-unused) finally functional. **Not yet published to the VS Code Marketplace**, so there's no auto-update for end users — only the local working copy has it.

**If you're picking this up to do more website work**: skip the lint/test gates in `deployments/deploy.sh` (they're for the Electron desktop app, irrelevant to the website) and use `aws s3 sync pii_protector_website/ s3://ledebe.com/ --exclude "management/*" --exclude "*.backup"` directly. Bump the `i18n.js?v=` query param on any HTML page whose translations changed. Then purge Cloudflare cache or wait 4 hours.

**If you're picking this up to do more product/Store work**: the Microsoft Store identity (`LEDEBE.LedebeProtector`, publisher `CN=551BABE6-E7A9-4667-AAE2-CA3C196A56E9`) is frozen — only the version number changes between submissions. Build MSIX from Windows only, run `npm run dist:win-msix`.

---

## Headline

**Ledebe Protector is now live on the Microsoft Store** (2026-05-20). Public listing: **https://apps.microsoft.com/detail/9N6HCR9DSLPT**.

The work covered four broad areas:
- Building and submitting the MSIX (`.appx`) package to the Microsoft Store, including all Partner Center setup, identity, pricing, listing, and certification justifications.
- Refreshing the brand — replacing the old black-square logo with a transparent-background shield across the entire codebase, website, management portal, and VS Code extension.
- Updating ledebe.com to promote the Microsoft Store install path alongside the existing direct `.exe` download.
- Adding favicons, cleaning up duplicate downloads pages, and fixing a series of small content issues across the website.

## Microsoft Store status

| Item | Value |
|---|---|
| Public listing URL | https://apps.microsoft.com/detail/9N6HCR9DSLPT |
| Reserved app name | Ledebe Protector |
| Package identity | `LEDEBE.LedebeProtector` |
| Publisher | `CN=551BABE6-E7A9-4667-AAE2-CA3C196A56E9` |
| Publisher display name | `LEDEBE` |
| Version live | `1.0.0.0` (x64 desktop) |
| Base price | Free ($0.00 / £0.00) |
| Cert review outcome | Passed first attempt (2026-05-20) |

## What changed in the codebase

### Logo and icon refresh

The previous master had a solid black square around the shield baked into the pixels. That square was visible everywhere the logo appeared. Now the shield itself is the logo, on a transparent background, so it sits cleanly against any colour the Microsoft Store, Start menu, or website uses behind it.

Files replaced or regenerated from the new transparent shield master:

| File | Purpose |
|---|---|
| `assets/ledebe-Logo-to-be-used.png` | Source master (1024×1024 RGBA) |
| `assets/ledebe-logo.png` | Electron window icon (used at runtime by `main.ts:80`) |
| `assets/icon.png`, `.icns`, `.ico` | Mac and Windows app icon containers |
| `build/icon.png`, `build/icon.ico` | electron-builder auto-derives Win/Mac variants from these |
| `build/appx/*.png` | MSIX tile assets bundled into the `.appx` |
| `build/store/*.png` | Microsoft Store listing override images (uploaded separately) |
| `ledebe-logo.png` (root) | General-purpose copy |
| `pii_protector_website/logo.png` | Referenced by every website HTML file |
| `ledebe-management-portal/ledebe-logo.png` | Management portal header |
| `ledebe-protector-vscode/icon.png` | VS Code extension icon |
| `logo/ledebe-protector-icon-white-bg.png` | Standalone logo asset |

Removed: `ledebe-logo.svg` (outdated brand colours, unused) and `logo/ledebe-protector-icon-white-bg.svg` (unused).

One bug fix: the notification icon path in `index.html:5577` pointed at `src/assets/icon.png`, but `src/` is excluded from the build. Updated to `assets/ledebe-logo.png`.

### Microsoft Store build setup

New script in `package.json`:

```
npm run dist:win-msix
```

This runs `electron-builder --win appx --x64` and produces a Microsoft Store-ready `.appx` package in `dist-build/`.

The `package.json` build config now includes:
- `appx` added to `win.target` (alongside the existing `nsis` for direct downloads)
- A new `build.appx` block with the three identity fields Microsoft requires:

```
identityName: LEDEBE.LedebeProtector
publisher: CN=551BABE6-E7A9-4667-AAE2-CA3C196A56E9
publisherDisplayName: LEDEBE
displayName: Ledebe Protector
backgroundColor: #1e3a8a
```

These values come from Microsoft Partner Center (Apps and games → Ledebe Protector → Product identity). They must match exactly or Microsoft rejects the package.

### Why MSIX building has to happen on Windows

`electron-builder`'s AppX target needs Microsoft's `makeappx.exe` and `signtool.exe`. These are Windows-only binaries. On macOS the build either needs:
- Wine + PowerShell Core installed locally, or
- A Parallels Windows 10/11 VM

Neither was available on the Mac, so the actual build was done on Windows. The Mac side prepared all the code, configuration, and assets.

### First-build gotcha (Windows symlink permissions)

When the build was first attempted on Windows, electron-builder failed extracting its `winCodeSign` cache because Windows didn't allow symlink creation:

```
Cannot create symbolic link: A required privilege is not held
```

Fix: enable **Settings → Privacy & security → For developers → Developer Mode**, then wipe `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign` and retry. Subsequent builds were clean.

## Microsoft Partner Center setup

### Decisions made and entered

| Section | Choice |
|---|---|
| Category | Productivity |
| Markets | All worldwide markets |
| Audience | Public, discoverable |
| Release | As soon as it passes certification |
| Base price | Free ($0.00) |
| In-app purchases | Handled externally (Stripe / own payment system), declared via "purchases outside Microsoft commerce" |
| Free trial | None (base is free) |
| Organizational licensing | Both online (Microsoft Store for Business) and offline (IT-managed deployment) enabled |
| Privacy: collects PII | Yes — app uses crash reporter, company sync, and third-party AI APIs |
| Privacy policy URL | `https://ledebe.com/privacy` (must remain publicly hosted) |
| System requirements | 4 GB RAM minimum, keyboard and mouse required |
| Age rating | Universal (3+ / Everyone) almost everywhere; Brazil shows 14 due to in-app purchases — Brazilian regulatory quirk, doesn't restrict the market |

### Pricing model context

The Microsoft Store listing is **free**. Users can download and use the app at no charge. Inside the app, paid tiers from the existing pricing plan (`03_pricing_and_tiers.md`) are sold via the company's own payment system — not Microsoft Store commerce:

- Free — Personal use, default after install
- Pro — £8/month
- Team — £18/user/month
- Enterprise — custom

This matches the model used by ChatGPT, Claude, Notion, Slack — free download, monetise inside.

### Distribution channels

Two paths run in parallel:

| Channel | Build command | Output | Where it goes |
|---|---|---|---|
| Microsoft Store | `npm run dist:win-msix` | `.appx` | Uploaded to Partner Center, distributed via Store |
| Direct download | `npm run dist:win` | NSIS `.exe` | Pushed to S3 by `deploy-windows.sh`, downloadable from ledebe.com |

Both legitimate. Many products do both. ledebe.com/downloads/ now offers both options side-by-side, with Microsoft Store marked **Recommended**.

### Restricted capability — runFullTrust

Microsoft flags `runFullTrust` as a restricted capability requiring justification. Every Electron app needs it (Slack, Discord, VS Code, GitHub Desktop all use it). The Submission Options page in Partner Center has a justification explaining the capability is required for Electron's Node.js runtime, local file access, native OS integration, and Chromium renderer IPC — with the explicit note that the app installs no services, requests no elevated permissions, and modifies no system files.

Cert reviewers approved on first attempt.

### Reserved-name mishap

A second name (`LEDEBE.Ledebe`) was reserved before realising the cleaner approach was `LEDEBE.LedebeProtector`. The unused reservation is sitting idle — Microsoft will auto-release it after about 90 days, or it can be held for a future Ledebe sub-app.

### Listing content

Description, short description, 14 product features, 7 keywords, and screenshot captions are written and live on the listing. Screenshots show the Windows build's main flows: PII detection in real text, AI chat with PII redaction, custom terms, and dark mode. The description headline:

> Before you paste that customer email into ChatGPT, before you share that draft contract, before you send that spreadsheet of employee data — Ledebe Protector catches what shouldn't leave your device.

## Website (ledebe.com) updates

### Microsoft Store integration on the downloads page

`pii_protector_website/downloads/index.html` (the canonical `/downloads/` URL) now has two cards in the Windows section:

| Card | Order | Style |
|---|---|---|
| Microsoft Store + "Recommended" badge | First | Primary CTA, links to the Store listing |
| Direct Installer (.exe) | Second | Secondary CTA |

The SmartScreen warning notice was updated to clarify it only applies to the Direct Installer — the Microsoft Store version is signed by Microsoft and skips that friction entirely.

### Logo went live on the website

The new transparent shield is now the website logo across every page. One CSS fix was needed: `styles.css` had `.logo img { filter: brightness(0) invert(1); }` which forced the logo to render as a solid-white silhouette (it was originally meant for the black-square logo on the dark nav header). That filter was removed so the real navy/gold shield shows through.

### Favicons added

The website previously had no favicon — browsers showed the default globe icon in the tab. Generated a full favicon set from the transparent shield master and added the proper `<link>` tags to all 14 HTML files:

| File | Purpose |
|---|---|
| `favicon.ico` (multi-resolution) | Browser tab, Windows taskbar, bookmarks |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | Modern browser tabs |
| `apple-touch-icon.png` (180×180) | iOS "Add to Home Screen" |
| `android-chrome-192x192.png`, `512x512.png` | Android home screen and PWA install |

### Downloads page consolidation

The repo previously had **two** downloads pages: `pii_protector_website/downloads.html` and `pii_protector_website/downloads/index.html`. They had different nav, different content, and the more modern subdirectory version was the one all internal links pointed to. The orphan `downloads.html` was deleted (both locally and from the S3 bucket — it now returns 404). Three older "flat" pages (`terms.html`, `privacy.html`, `docs.html`) had stale links to `/downloads.html` and were updated to point at `/downloads/`.

### Email correction

The Partner Center support contact was initially populated with `support@ledebe.com` — but `support@` doesn't exist yet (it's a planned alias per `09_pending_tasks.md`). All references in the live website terms/footer go to `hello@ledebe.com`, which is the actual monitored address. Partner Center fields should match: the canonical support contact for now is `hello@ledebe.com`.

### Cloudflare CDN in the loop

ledebe.com is fronted by Cloudflare (not just S3 direct). Cloudflare caches assets at the edge with `max-age=14400` (4 hours), so any S3 deploy is invisible to visitors until either:
- The natural cache TTL expires (up to 4 hours), or
- Someone purges Cloudflare's cache manually at `dash.cloudflare.com → ledebe.com → Caching → Configuration → Purge Everything`

This caught us during the session — multiple times an obvious deploy looked "broken" because Cloudflare was still serving the previous version. Worth knowing for every future website change.

## Session: Multilingual website + misleading-claim cleanup (May 2026)

### The problem

When a user switched languages on the website, only the homepage updated. Every other page (pricing, downloads, demo, contact, about, docs, privacy, terms) kept showing English. Root cause: `i18n.js` only contained translations for the homepage namespace, and only the homepage had `data-i18n` attributes wired into its HTML. The other pages had zero — 109 `data-i18n` attrs on `index.html` vs. zero everywhere else.

### What now works

Every user-facing page is now fully translatable across **English, Spanish, French, Arabic, and Chinese**. Arabic also flips the page direction to RTL.

| Page | Translation keys |
|---|---|
| `pricing/index.html` | 104 |
| `downloads/index.html` | 48 |
| `demo/index.html` | 37 |
| `contact/index.html` | 29 |
| `about/index.html` | 41 |
| `docs/index.html` | 162 |
| `privacy/index.html` | 75 |
| `terms/index.html` | 68 |
| **Total unique keys** | **564** |

That's **2,820 individual translation strings** (564 keys × 5 languages), all validated to resolve before each deploy via a Node.js script that loads `i18n.js`, walks every `data-i18n` / `data-i18n-html` attribute in every HTML page, and confirms every key exists in every language.

### Infrastructure additions to `i18n.js`

- Each language block gained 8 new namespaces: `pricing`, `downloads`, `demo`, `contact`, `about`, `docs`, `privacy`, `terms`.
- Added a custom DOM event so page scripts can re-render dynamic content when the user switches language. After `updateContent()` runs, it dispatches `document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: currentLang } }))`. The pricing billing toggle hooks this event to redraw "per month" / "per year" / "Save £21 vs monthly" labels in the active language.
- Pricing-page inline script was refactored to fetch billing labels via `t('pricing.billing.perMonth')` etc. rather than hardcoded English. The `i18n.js` script tag was moved above the inline script on pricing so `t()` is defined when the initial `setBilling()` fires.
- File grew from ~64 KB (homepage-only) to ~278 KB (all pages).

### Translation engineering decisions worth knowing

- **Code, file paths, keyboard shortcuts, and `[LDB_*]` placeholders are NOT translated.** They live in the raw HTML alongside translated prose. Translating `chmod +x` or `⌘K` helps nobody. This was important for docs and privacy pages especially.
- **Currency stayed in £ GBP across all languages.** No FX conversion. That's a separate decision involving real exchange rates and Paddle's multi-currency setup — out of scope for this pass.
- **Legal text (privacy + terms) was translated by AI.** GDPR rights, governing-law clauses, liability limits — these should be reviewed by a lawyer or professional translator in each target jurisdiction before relying on the translated versions for any legal purpose. They're functional but not authoritative.
- **HTML in translations.** Strings with inline `<strong>`, `<em>`, `<code>` use `data-i18n-html` (sets `innerHTML`) instead of `data-i18n` (sets `textContent`). Translators preserving the tags is required for the page to render correctly.
- **Cache-buster bumps**: `i18n.js?v=4` → `?v=5` (pricing only, mid-session) → `?v=6` (rest of pages, batched) → `?v=7` (homepage after CTA cleanup). The version param is the only thing that forces browsers and Cloudflare to re-fetch the JS.

### Misleading product claims removed

The user explicitly called the **"Try the Web App — No Install Needed"** card on the downloads page "a lie" — `app.ledebe.com` either doesn't exist or doesn't work as advertised. While translating, the following were removed:

| Where | What was removed | Status |
|---|---|---|
| `downloads/index.html` | Entire "Try the Web App — No Install Needed" hero card + Open Web App button | ✅ deployed |
| `about/index.html` | "Web app — use Ledebe instantly in any browser at app.ledebe.com. No installation needed." bullet from product list | ✅ deployed |
| `about/index.html` | "Try Web App" CTA button | ✅ deployed |
| `about/index.html` | "and in your browser" phrase removed from CTA box subtitle | ✅ deployed |
| `index.html` (homepage) | "Try Web App Free →" button in bottom CTA section | ✅ deployed |
| `index.html` (homepage) | "and in your browser" removed from CTA section subtitle ("Works on Mac, Windows, and Linux." now) | ✅ deployed |
| `i18n.js` | Orphan `cta.webAppBtn` key + the now-unused `downloads.web.*` namespace dropped from all 5 languages | ✅ deployed |

### Web-app references still live on the site (not yet removed)

Audit identified these remaining references — left in place because they're either non-marketing links or the user hasn't confirmed they should go:

- `hero.webAppBtn` key in `i18n.js` (5× — orphan, not referenced from any HTML anymore but the key sits there)
- "Web App" link in the footer of **every page** (homepage, pricing, downloads, demo, contact, about, docs, privacy, terms — all 9 places). Goes to `app.ledebe.com`.
- Homepage Personal-tier "Get started free" button on the embedded pricing strip points to `app.ledebe.com` (line 778)
- Pricing-page Personal-tier "Get started free" button points to `app.ledebe.com` (line 399)
- Privacy and Terms pages mention "web app" as one of the surfaces the policy/terms cover

### Audit of other claims to verify (delivered, not yet acted on)

The user asked for a list of "things we claim but don't have yet." Compiled but pending user confirmation:

- Microsoft Store listing (linked from downloads — verified earlier this session, real)
- Snap Package for Linux (`ledebe-protector_1.0.0_amd64.snap`) — link exists, artifact not verified
- VS Code Marketplace listing (`Ledebe.ledebe-protector`) — linked from multiple pages, not verified
- Calendly demo booking (`calendly.com/hello-ledebe/30min`) — embedded on demo page, not verified
- Paddle payments integration — claimed in pricing trust strip + FAQ
- 14-day money-back guarantee — claimed in pricing + terms (only meaningful if paid plans exist)
- AI Chat with own API key (OpenAI/Anthropic/Google) — claimed as Pro feature, in docs
- Document/PDF/DOCX upload + OCR — claimed as Pro feature
- Company Sync — claimed in Team tier
- Admin dashboard, Audit log — claimed in Team tier
- SSO (marked "coming soon" — probably fine)
- On-premise deployment — claimed in Enterprise tier
- HIPAA reports (appears in Spanish homepage Enterprise tier — may be over-claiming)
- "Highlight to Protect / Unprotect" feature

The user hasn't yet said which are real vs. not. Once confirmed, prune all referenced claims (HTML + i18n keys) in one batch.

### Deploy approach used

The existing `deployments/deploy.sh` runs `npm run build` (TypeScript compile for the Electron desktop app) and Playwright e2e tests before syncing — none of which are relevant to a website-only deploy, and any of which could fail and abort. Instead, used the deploy script's underlying command directly:

```bash
aws s3 sync pii_protector_website/ s3://ledebe.com/ \
  --exclude "management/*" --exclude "*.backup"
```

**Note**: I dropped the `--exclude "downloads/*"` flag that the existing deploy script uses. That exclude protects desktop-app artifact DMG/EXE files — but those actually live on a **different bucket** (`s3://ledebe/downloads/`, per `deploy-artifact.sh`), not `s3://ledebe.com/downloads/`. The `s3://ledebe.com/downloads/` path only contains the downloads-page HTML. So dropping the exclude is safe and lets the downloads page actually deploy. The earlier note in this doc (line 242) recommending `aws s3 cp` for the downloads page can be deprecated — a plain sync without the exclude works.

Three deploys happened during this session:
1. After translating the pricing page (only `i18n.js` and `pricing/index.html` shipped)
2. After translating the remaining 7 pages (all 8 pages + `i18n.js`)
3. After removing "Try Web App Free →" from homepage (homepage + `i18n.js`)

Each deploy was followed by a `curl` check against `https://ledebe.com/<page>/` to confirm HTTP 200 and that `data-i18n` attrs were present in the served HTML.

### Files modified

- `pii_protector_website/i18n.js` (+~210 KB of translations + the `i18n:changed` event dispatch)
- `pii_protector_website/index.html` (homepage CTA cleanup, cache-buster bump to v=7)
- `pii_protector_website/pricing/index.html` (data-i18n attrs, billing-toggle refactor, cache-buster v=5)
- `pii_protector_website/downloads/index.html` (data-i18n attrs, web-app card removed, cache-buster v=6)
- `pii_protector_website/demo/index.html` (data-i18n attrs, cache-buster v=6)
- `pii_protector_website/contact/index.html` (data-i18n attrs, cache-buster v=6)
- `pii_protector_website/about/index.html` (data-i18n attrs, web-app bullet + CTA removed, cache-buster v=6)
- `pii_protector_website/docs/index.html` (data-i18n attrs, cache-buster v=6)
- `pii_protector_website/privacy/index.html` (data-i18n attrs, cache-buster v=6)
- `pii_protector_website/terms/index.html` (data-i18n attrs, cache-buster v=6)

**No git commits made.** All changes are working-tree only on the `PlayWithQ` branch. Deploy went directly from working tree to S3. Worth committing for completeness when convenient — the diff against `origin/PlayWithQ` is all the website work above.

## How to build and submit (for future releases)

### Build on Windows

```powershell
git pull
npm install
npm run dist:win-msix
```

Output appears at `dist-build/Ledebe Protector <version>.appx` (~138 MB).

If the build fails with `Cannot create symbolic link: A required privilege is not held`:
1. Settings → Privacy & security → For developers → enable Developer Mode
2. Wipe `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`
3. Retry

### Test before submitting

The `.appx` is intentionally unsigned (Microsoft signs it server-side). To verify the app works on Windows without going through cert:

```powershell
& "dist-build\win-unpacked\Ledebe Protector.exe"
```

Click through every major flow. To install the `.appx` locally, self-sign with a temporary cert matching the publisher GUID (full PowerShell sequence is documented in the conversation history).

### Upload to Partner Center

1. Sign in to Partner Center, open the Ledebe Protector submission.
2. Replace the previous `.appx` in the Packages section. **Microsoft enforces unique identity per version** — uploading a new `.appx` with the same `1.0.0.0` version but different bytes fails. Either bump the version in `package.json` first, or remove the previous `.appx` from the submission before uploading the new one.
3. Re-validate (about 30 seconds). The `runFullTrust` warning is expected and harmless.
4. Confirm everything else is still saved, then submit.

Cert review takes 24–72 hours typically; first submission was approved within hours.

### Update the website after a Store update

Whenever you change something in `pii_protector_website/`:

```bash
aws s3 sync pii_protector_website/ s3://ledebe.com/ \
  --exclude "downloads/*" --exclude "management/*" --exclude "*.backup"
```

Note the `downloads/*` exclude is meant for the binary download files (the `.exe`, `.dmg`, etc.). It also accidentally excludes `pii_protector_website/downloads/index.html`. To deploy the downloads page, upload it directly:

```bash
aws s3 cp pii_protector_website/downloads/index.html s3://ledebe.com/downloads/index.html
```

Then **purge Cloudflare cache** at the dashboard or wait 4 hours.

## Open items

- **Cloudflare purge after deploys** — every website change needs a manual cache purge until automated. Worth setting up Cloudflare API integration so deploy scripts can purge automatically.
- **Reserved name `LEDEBE.Ledebe`** is still unused. Either release it, hold for a future Ledebe parent/launcher app, or let Microsoft auto-release after 90 days.
- **Arm64 support** — currently x64 only. Add `arm64` to `build.win.target` if/when Windows-on-Arm share warrants supporting it natively. Until then, x64 runs on Arm devices via emulation.
- **VS Code extension submodule** has an uncommitted icon update inside its own repository. Commit inside `ledebe-protector-vscode/` when the extension is re-released.
- **Privacy policy** at `https://ledebe.com/privacy` must remain publicly accessible and should clearly mention what each cloud feature (crash reporter, company sync, AI integration) transmits and the user's right to opt out.
- **Flat vs subdirectory page duplicates** — same pattern that existed for downloads also exists for `terms.html` vs `terms/index.html`, `privacy.html` vs `privacy/index.html`, `docs.html` vs `docs/index.html`. The subdirectory versions are canonical; the flat versions are likely orphans. Decide whether to consolidate.
- **Set up `support@ledebe.com` alias** — per `09_pending_tasks.md`. Until then, everything points to `hello@ledebe.com`.
- **Plan v1.0.1** — bump version, rebuild, upload as new submission. Identity values stay frozen; only the version number changes.
- **Monitor Partner Center Health module** — watch for crash reports, install failures, and reviews in the first weeks. Respond to reviews; Microsoft rewards engaged developers with better visibility.
- **Finish web-app reference cleanup** — the prominent "Try Web App Free" buttons are gone, but `app.ledebe.com` is still linked from: every footer (9 pages, "Web App" link), the homepage embedded pricing strip Personal-tier button (`index.html:778`), and the standalone pricing page Personal-tier CTA (`pricing/index.html:399`). Either build the web app or remove all of these.
- **Verify and prune other "vaporware" claims** — audit list compiled but pending user decision: Snap package, VS Code Marketplace listing, Calendly booking, Paddle integration, 14-day refund (only meaningful with paid checkout), AI chat with own API key, Document/PDF upload + OCR, Company Sync, Admin dashboard, Audit log, On-premise, HIPAA reports, Highlight to Protect. Anything that doesn't actually work should be removed in one batch.
- **Translated privacy & terms need legal review** — `privacy/index.html` and `terms/index.html` are now live in es/fr/ar/zh, but the translations were AI-generated. GDPR rights wording, governing-law clauses ("England and Wales"), liability limits — these need a lawyer or pro translator before being relied on legally. Could add a banner at the top of non-English versions saying "English version is authoritative."
- **Commit website translation work to git** — all the translation changes (~278 KB on `i18n.js` + the `data-i18n` attrs added across 9 HTML files + homepage CTA cleanup) live in the working tree on `PlayWithQ` and were deployed straight to S3 without commits. Worth committing for traceability.
- **Drop orphan i18n keys** — `hero.webAppBtn` exists in all 5 languages but is no longer referenced from any HTML. The `downloads.web.*` namespace was already cleaned up but a similar dead-key audit on the rest of the file would shave bytes.
- **Browser extension work-in-progress** — a new `ledebe-browser-extension/` directory now exists at the repo root, untracked, containing `manifest.json`, `background.js`, `content.js`, `detector.js`, `content.css`, `popup.{html,js,css}`, and a `README.md`. The downloads page (`pii_protector_website/downloads/index.html`) has been updated locally to include `.extension-card` CSS and a "Browser Extension Preview" section. **This is separate from the translation/cleanup session above and is not yet deployed.** Before deploying: (a) confirm the extension is real and working, (b) decide if "Preview" wording is honest (in vs. out of beta?), (c) if it ships, add `data-i18n` attributes to the new section + translation keys for `extension.*` namespace across all 5 languages, (d) commit `ledebe-browser-extension/` to git.
- **Publish VS Code extension v0.1.2 to the Marketplace** — the new Chat tab only exists on the user's local install. Requires Azure DevOps PAT for the `ledebe` publisher, then `vsce login ledebe` + `vsce publish patch`. Until this happens, the "VS Code Marketplace listing" claim on the website (`Ledebe.ledebe-protector` link) is still unverified vaporware.
- **Commit the VS Code extension changes** — `ledebe-protector-vscode/src/aiProviders.ts` (new), `src/panel.ts`, `src/extension.ts`, `package.json` (version bump), and the generated `ledebe-protector-0.1.2.vsix` are all uncommitted in working tree.
- **Add a model picker to the Chat tab** — defaults (`gpt-4o-mini`, `claude-sonnet-4-6`, `gemini-2.5-flash`) are hardcoded in `aiProviders.ts`. Expose as settings keys (e.g. `ledebe-protector.openaiModel`) so power users can pick GPT-4o, Opus, etc.
- **Streaming responses in the Chat tab** — each turn currently awaits the full reply with only a "Thinking…" indicator. Adding SSE streaming per provider would make long responses feel much faster.

## Session: VS Code extension Chat tab (May 2026)

### The problem

The Ledebe Protector VS Code extension ([ledebe-protector-vscode/](../ledebe-protector-vscode/)) had a settings menu that let users store API keys for OpenAI, Anthropic, or Gemini in VS Code SecretStorage — but **nothing in the extension ever read those keys**. The panel only had two tabs: **Protect** (paste text → mask PII → copy out) and **Custom Terms**. There was no chat UI, so the user (rightly) asked "after adding the API key, how do I know when I want to chat with it or just plain default?" — the answer was that chat wasn't built yet. Provider/key plumbing had been scaffolded ahead of the actual feature.

### What now works

A third **Chat** tab next to Protect and Custom Terms. Behaviour:

- Status chip at the top shows the active provider + model — e.g. `Anthropic (Claude) · claude-sonnet-4-6`. Comes from existing `aiProvider` setting + stored secret.
- If no key is stored for the current provider, the input is disabled and a red banner offers a one-click **Add API Key** button that opens the same settings flow as the gear icon.
- Type a message → it's masked using the existing PII rules + custom terms → sent to the chosen provider over HTTPS using the stored API key → reply tokens are restored before display.
- A small collapsed `<details>` toggle under each message reveals the raw masked text actually sent / received — useful for debugging or just verifying the masking did its job.
- Token continuity across turns: a per-session token map persists so the same real value gets the same `[LDB_*]` placeholder on every turn. This means the model can refer back to "the email in your last message" coherently.
- A **Clear** link in the chat header resets the conversation. The existing "New Session" command in the panel header now offers a third option, **Clear chat only**, alongside the existing per-file and all-files options.

### Files added / modified

| File | Change |
|---|---|
| `ledebe-protector-vscode/src/aiProviders.ts` | **New.** Single `callProvider(provider, key, history)` that fetches against OpenAI Chat Completions, Anthropic Messages, or Gemini `generateContent`. Hardcoded default models: `gpt-4o-mini`, `claude-sonnet-4-6`, `gemini-2.5-flash`. Includes a short system prompt explaining `[LDB_*]` tokens are opaque redacted values to be reused verbatim. |
| `ledebe-protector-vscode/src/panel.ts` | Added Chat tab markup, CSS, and client-side JS. Added `_chatMap` (persistent token→original map across turns) + `_chatHistory` (masked messages sent to the model). New message handlers: `chatSend`, `chatClear`, `chatStatus`, `openSettings`. New outgoing messages: `chatUserMessage`, `chatAssistantMessage`, `chatError`, `chatPending`, `chatCleared`, `chatStatus`. Refreshes status when the view becomes visible. |
| `ledebe-protector-vscode/src/extension.ts` | `newSession` command gained a third quick-pick option **Clear chat only**. **Clear all files** now also clears the chat. |
| `ledebe-protector-vscode/package.json` | Version bump `0.1.1` → `0.1.2`. No new commands or settings keys. |

Build pipeline (webpack + ts-loader) and lint (`npm run compile` / `npm run lint`) both pass clean. Webpack output is `dist/extension.js` (~57 KB).

### Local install state

The user already had `ledebe.ledebe-protector-0.1.1` installed at `~/.vscode/extensions/`. After bumping to 0.1.2:

```bash
vsce package                                                    # produces ledebe-protector-0.1.2.vsix
code --install-extension <path>/ledebe-protector-0.1.2.vsix --force
```

VS Code treats `--force` as an upgrade (no uninstall needed). User then needs **Developer: Reload Window** to see the new tab. Confirmed installed.

### Auto-update — not in place yet

The user wanted "auto-update" so they don't have to keep packaging and reinstalling. That only works once the extension is published to the **VS Code Marketplace** (or Open VSX). One-time steps required:

1. Get a Personal Access Token from `dev.azure.com` (the publisher account `ledebe` already exists since v0.1.1 was packaged with that publisher name).
2. `vsce login ledebe`
3. `vsce publish patch` (this bumps version + uploads in one step — replaces `vsce package` + manual install).

After first publish, every install gets auto-updates within ~24h. Until then, the bump-package-install loop is the local equivalent and only updates the user's own machine.

### Provider implementation notes

- Uses Node 18+ global `fetch`. VS Code 1.85+ ships Node 20 (Electron 25+), so no `node-fetch` needed.
- OpenAI: `POST /v1/chat/completions` with `Authorization: Bearer <key>`.
- Anthropic: `POST /v1/messages` with `x-api-key` + `anthropic-version: 2023-06-01`. Default model `claude-sonnet-4-6` per "use latest/most capable Claude" guidance.
- Gemini: `POST .../models/<model>:generateContent?key=<key>`. Role mapping is `assistant` → `model`.
- All three send a `system` prompt instructing the model to treat `[LDB_*]` tokens as opaque identifiers and reuse them verbatim — important because if the model invents new tokens or paraphrases existing ones, restoration in the panel will silently fail.
- Errors from the provider are surfaced in-chat as a red bubble with the HTTP status + body text. On error the user's masked turn is popped from history so a retry doesn't double-send it.

### What this unblocks

- The original product claim "AI Chat with own API key (OpenAI/Anthropic/Google)" listed in the audit (see line 287 of this doc) — was previously vaporware in the VS Code extension. The VS Code surface now actually delivers it.
- The website-side claim of the same feature still needs verifying in the Electron desktop app separately. The VS Code extension's `Chat` tab is independent code from anything in the main repo.

### Not done in this session

- **Did not publish to the VS Code Marketplace.** The extension lives only on the user's machine. The "VS Code Marketplace listing (`Ledebe.ledebe-protector`)" claim in the website audit (line 283) is still unverified — to make that claim real, publish.
- **Did not commit.** Both new + modified files under `ledebe-protector-vscode/` are uncommitted. `ledebe-protector-vscode` is tracked as a directory in the main repo (status shows it as modified, not a submodule).
- **No streaming responses.** Each turn does a single fetch and awaits the full reply. For long Claude/GPT outputs this means a noticeable wait with just a "Thinking…" indicator. Streaming would require SSE parsing per provider.
- **No model picker UI.** Default model per provider is hardcoded in `aiProviders.ts` `DEFAULT_MODELS`. Easy follow-up: expose as a settings key.
- **No conversation persistence.** Reload the window → chat history is gone. The PII token map also dies with the session, which is correct from a privacy standpoint, but means there's no "history" feature.
- **No token-budget management.** History grows unbounded — eventually you'll hit the model's context window. For a chat-with-the-codebase tool this is fine; for very long sessions, add truncation.

## Reference points

| File | Why it matters |
|---|---|
| `package.json` | All build config + Partner Center identity values |
| `main.ts` | Electron main process, window icon reference (line 80) |
| `forge.config.js` | Electron Forge config (uses `assets/icon.icns` for Mac) |
| `how to plan/03_pricing_and_tiers.md` | Pricing tiers that informed the free-on-Store decision |
| `deploy-windows.sh` | Direct-download distribution channel to ledebe.com |
| `deployments/deploy.sh` | Full website deploy with lint/format/audit/build/test checks |
| `build/appx/` | MSIX tile assets, bundled inside the package |
| `build/store/` | Microsoft Store override images, uploaded to Partner Center separately |
| `pii_protector_website/downloads/index.html` | Canonical downloads page (the one users hit at `/downloads/`) |
| `pii_protector_website/styles.css` | Site-wide CSS, including the `.logo img` rule |
| `ledebe-protector-vscode/src/aiProviders.ts` | VS Code Chat tab — provider HTTP clients (OpenAI / Anthropic / Gemini) + default models |
| `ledebe-protector-vscode/src/panel.ts` | VS Code Chat tab — webview UI, masked-history state, message protocol |
| `ledebe-protector-vscode/src/apiKey.ts` | API key SecretStorage helpers + provider list (unchanged this session, but the Chat tab depends on it) |

## Recent commits on the `PlayWithQ` branch

- `7d97732` — Switch all logos to transparent shield (drop black background)
- `6ba148d` — Add Microsoft Store logo set
- `15434fc` — Wire up MSIX/AppX target and refresh logo across the app

All pushed to `origin/PlayWithQ`. Website changes (favicon, MS Store link, CSS filter removal, downloads consolidation) were deployed directly to S3 without separate commits — worth committing them to the branch for completeness when convenient. The `main` branch has not been updated; merge `PlayWithQ` → `main` whenever the work is considered stable.

## After Microsoft accepts the submission (done — for reference)

1. ✅ Status visible in Partner Center → submission page.
2. ✅ App went live at https://apps.microsoft.com/detail/9N6HCR9DSLPT.
3. ✅ Listing linked from ledebe.com/downloads/ so users can choose between Store install and direct download.
4. Future updates: bump version in `package.json`, rebuild, upload a new `.appx` to Partner Center as a new submission. The identity values stay the same; only the version changes.
