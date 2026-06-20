# Ledebe Browser Protector Privacy Notes

Ledebe Browser Protector runs locally in the browser.

## What it stores

- `chrome.storage.sync`
  Used for extension settings such as enabled state, custom terms, safe-send preference, and paused hosts.

- `chrome.storage.session`
  Used for temporary placeholder-to-original mappings needed to restore protected text during the current browser session.

## What it does not do

- It does not send protected text or placeholder mappings to a Ledebe server.
- It does not store restore mappings in persistent local extension storage.

## Important v1 behavior

- Restore mappings are session-only and are cleared when the browser session ends.
- Whole-field protect and restore are intentionally limited in rich editors where direct DOM replacement could strip formatting or produce misleading results.
