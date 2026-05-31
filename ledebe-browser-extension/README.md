# Ledebe Browser Protector

Chrome-compatible MVP for protecting sensitive data directly in browser text fields.

## What this version does

- Scans `input`, `textarea`, and `contenteditable` fields while you type
- Detects emails, phone numbers, SSNs/ID numbers, credit cards, IPs, API keys, and custom terms
- Shows a lightweight warning card when sensitive data is present
- Replaces risky text with Ledebe tokens such as `[LDB_EMAIL_1]`
- Adds a right-click `Protect with Ledebe` action for editable text
- Warns on form submit when unprotected sensitive data is still present

## Load it in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `ledebe-browser-extension/` folder

## Notes

- This is a local-first MVP. It uses `chrome.storage.sync` only for extension settings.
- The current version focuses on field protection and safe-send warnings rather than full inline highlights.
