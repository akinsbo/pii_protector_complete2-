# Ledebe Browser Protector

Chrome-compatible extension for protecting sensitive data directly in browser text fields.

## What this version does

- Scans `input`, `textarea`, and `contenteditable` fields while you type
- Detects emails, phone numbers, SSNs/ID numbers, credit cards, IPs, API keys, and custom terms
- Shows a lightweight warning card when sensitive data is present
- Replaces risky text with unique Ledebe tokens such as `[LDB_EMAIL_AB12_1]`
- Adds a right-click `Protect with Ledebe` action for editable text
- Warns on form submit when unprotected sensitive data is still present
- Stores placeholder mappings only in `chrome.storage.session`, so protected text can be restored later in another editable field during the same browser profile session without writing raw values to disk

## Load it in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `ledebe-browser-extension/` folder

## Notes

- This is a local-first extension. It uses `chrome.storage.sync` for settings and `chrome.storage.session` for temporary restore mappings.
- Whole-field protect and restore are limited to plain editable fields Ledebe can update safely. Rich editors such as Gmail compose and Google Docs use targeted selection workflows to avoid formatting loss or misleading restores.
- The current version focuses on field protection, restore, and safe-send warnings rather than a full AI workflow inside the extension UI.
