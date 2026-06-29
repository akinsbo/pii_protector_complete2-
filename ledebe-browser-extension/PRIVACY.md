# Ledebe Browser Protector Privacy Notes

Ledebe Browser Protector runs locally in the browser.

## What it stores

- `chrome.storage.sync`
  Used for extension settings such as enabled state, custom terms, safe-send preference, and paused hosts.

- `chrome.storage.local`
  Used for placeholder-to-original mappings when "remember across restarts" is on, so restored values can remain available after Chrome restarts.

- `chrome.storage.session`
  Used for temporary placeholder-to-original mappings needed to restore protected text during the current browser session when "remember across restarts" is off.

## What it does not do

- It does not send protected text or placeholder mappings to a Ledebe server.
- It does not sync protected text or placeholder mappings through Ledebe-controlled infrastructure.

## Important v1 behavior

- Restore mappings are scoped to the current host.
- Restore mappings are cleared when the browser session ends if "remember across restarts" is off.
- Whole-field protect and restore are intentionally limited in rich editors where direct DOM replacement could strip formatting or produce misleading results.
