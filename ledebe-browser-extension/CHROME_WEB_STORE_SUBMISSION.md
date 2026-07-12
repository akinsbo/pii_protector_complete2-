# Chrome Web Store Submission

This extension is ready to package from [ledebe-browser-extension](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/ledebe-browser-extension).

## Upload Package

- Upload ZIP: [ledebe-browser-protector-1.2.10.zip](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/ledebe-browser-protector-1.2.10.zip)
- If you rebuild it, include only the runtime files:
  - `manifest.json`
  - `background.js`
  - `content.js`
  - `content.css`
  - `detector.js`
  - `sidepanel.html`
  - `sidepanel.js`
  - `sidepanel.css`
  - `icon-16.png`
  - `icon-32.png`
  - `icon-48.png`
  - `icon-128.png`
  - `ledebe-icon.png`
  - `README.md`
  - `PRIVACY.md`

## Store Listing Copy

- Name: `Ledebe Browser Protector`
- Summary: `Mask sensitive data in AI chats before it leaves the page, then restore the real values only inside Ledebe's panel.`
- Category suggestion: `Productivity`
- Language: `English`

## Description Draft

Ledebe Browser Protector helps you share prompts with AI tools without exposing raw personal or sensitive data.

What it does:

- Masks emails, phone numbers, IDs, cards, IPs, tokens, names, addresses, and custom terms as you type or paste.
- Works on popular AI chat surfaces including ChatGPT, Claude, Gemini, Perplexity, Copilot, Poe, DeepSeek, and Grok.
- Keeps placeholder tokens in the message that gets sent.
- Restores the real values only inside Ledebe's panel, not in the page DOM.
- Lets you manually protect or unprotect values from the side panel or context menu.

Privacy:

- All detection and masking happen locally in the browser.
- Protected values are not sent to Ledebe servers.
- Settings are stored in `chrome.storage.sync`.
- Placeholder mappings are stored per host in `chrome.storage.local` or `chrome.storage.session`, depending on the user's persistence setting.

## Privacy Tab

- Single purpose:
  - `Mask sensitive data in AI chat inputs locally before it is sent, and restore those values only inside the extension UI for the current site.`
- Remote code:
  - `No, I am not using remote code.`
- Data handling note:
  - The extension handles website content, form data, and user-provided sensitive data locally in order to detect and replace sensitive values before the user sends a prompt.
- Recommended disclosure stance:
  - Disclose that the extension handles website content and form data because it reads editable AI chat inputs.
  - Disclose that the data stays on-device and is not transmitted to Ledebe.
- Privacy policy URL:
  - `https://ledebe.com/privacy/`

## Permission Justifications

- `storage`
  - Stores user settings and host-scoped placeholder mappings needed for local masking and restore.
- `contextMenus`
  - Adds the `Protect with Ledebe` right-click action for selected text or editable fields.
- `sidePanel`
  - Opens the native Chrome side panel that shows protected values, restore results, settings, and manual actions.
- `<all_urls>`
  - Needed because users can invoke manual protection on any page, and supported AI chat experiences are spread across multiple domains. The extension only auto-protects on known AI hosts.

## Images

- Required icon:
  - `icon-128.png` is present in the extension package.
- Ready screenshots:
  - [screenshot-01.jpg](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/browser-extension-screenshots/store-ready/screenshot-01.jpg)
  - [screenshot-02.jpg](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/browser-extension-screenshots/store-ready/screenshot-02.jpg)
- Screenshot sizes checked:
  - `screenshot-01.jpg`: `1280x800`
  - `screenshot-02.jpg`: `1280x800`
- Promo image requirement from Chrome:
  - One `440x280` promotional image is required.
- Current candidate sources:
  - [appstore-01.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-01.png)
  - [appstore-02.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-02.png)
  - [appstore-03.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-03.png)
  - [appstore-04.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-04.png)
  - [appstore-05.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-05.png)
  - [appstore-06.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-06.png)
  - [appstore-07.png](/Users/o.b.a/Documents/Olaolu/CodeDevelopment/pii_protector_complete2/app-store-assets/screenshots/appstore-07.png)

## Test Instructions Draft

1. Open `https://chatgpt.com/`.
2. Focus the message composer and type or paste `Contact me at jane@example.com and +1 415 555 0182`.
3. Confirm the email and phone number are replaced with `[LDB_...]` tokens before send.
4. Confirm the Ledebe panel shows the original values as protected items.
5. Send the prompt and confirm the page keeps placeholders.
6. If the assistant echoes a placeholder token, confirm the real value is restored only inside the Ledebe panel.
7. Right-click selected text in an editable field and confirm `Protect with Ledebe` appears.

## Review Risks To Watch

- The checked-in ZIP must be rebuilt if you want it to include the current uncommitted `content.js` changes.
- The local DOM test suite currently fails on Node `20.10.0` because of a `jsdom` dependency issue, even though the pure logic tests pass.
- Be precise in the Privacy tab: this extension handles sensitive page content locally, so avoid claiming it does not handle user data at all.
