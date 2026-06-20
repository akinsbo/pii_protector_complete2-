# Ledebe Browser Protector

A Chrome-compatible (Manifest V3) extension that **masks sensitive data as you
type or paste** into AI chats, then **reveals your real values back in the
reply** — so your PII never actually leaves the page.

## What it does

- **Catches PII live.** As you type or paste into an AI composer (ChatGPT,
  Claude, Gemini, Perplexity, Copilot, Poe, DeepSeek, Grok, …), each detected
  value is swapped in place for a placeholder such as `[LDB_EMAIL_AB12_1]`. The
  value you're still in the middle of typing is left alone until you move on.
- **Detects** emails, phone numbers, SSNs/ID numbers, credit cards (Luhn-checked),
  IPs, UK National Insurance numbers, API keys/tokens, and your own custom terms.
- **Slide-in side panel.** When something is detected, a panel slides in listing
  every value and its placeholder. Click a row to **unprotect** (reveal) it or
  **protect** an exposed one — a live toggle.
- **Keeps placeholders on send.** Because replacement happens while you type, the
  text already carries placeholders by the time you press Enter.
- **Reveals replies in the panel.** When the AI echoes a placeholder, the reply
  is shown with your real values **in the side panel only** (with a Copy button).
  The page DOM is never modified, so nothing can re-enter the site's data flow.
- **Right-click `Protect with Ledebe`** and a popup **Protect active field**
  button for manual, on-demand masking on any site.

## Architecture

| File | Purpose |
| --- | --- |
| `detector.js` | Pure detection + masking + restore core (`detectPII`, `maskText`, `computeLiveReplacement`, `restorePlaceholders`). DOM-free and unit-tested. |
| `content.js` | DOM glue: live type/paste replacement, the slide-in panel, and AI-response restoration. |
| `content.css` | Toast, field flash, restored-value style, and the slide-in panel. |
| `popup.html/js/css` | Settings + manual actions. |
| `background.js` | Service worker: context menu, default settings, session-storage access. |

## Load it in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `ledebe-browser-extension/` folder

## Tests

Pure-logic tests (zero dependencies, Node's built-in runner) cover the
type/paste catch engine and the restore path:

```bash
cd ledebe-browser-extension
npm test        # runs `node --test`
```

## Privacy

Local-first. Settings live in `chrome.storage.sync`; the token→value map lives in
`chrome.storage.local` (when "remember across restarts" is on) or
`chrome.storage.session` otherwise. Raw values are never sent anywhere.
