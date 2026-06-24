# Ledebe Browser Protector — Test Plan

Four layers:

- **L1 Unit** (`node --test`) — pure logic in `detector.js`. No deps.
- **L2 DOM integration** (jsdom) — real `content.js` driven against a fake DOM; covers the `<textarea>` masking + restore paths (contenteditable needs a real browser).
- **L3 E2E** (Playwright + Chromium) — the actual extension loaded in Chromium, driving a fixture page that mimics an AI composer + reply.
- **L4 Manual QA** — things automation can't reach reliably (live ChatGPT/Claude/Gemini DOM, the native side‑panel push, cross‑tab behaviour).

IDs: `U#` unit, `D#` DOM, `E#` E2E, `M#` manual.

---

## L1 — Unit (detector.js)

### Detection — core types
- **U1 Email** — `john@example.com`, `a.b+tag@sub.example.co.uk` → EMAIL. Plain words → none.
- **U2 Phone valid** — `(415) 555-0182`, `+44 7700 900482` → PHONE.
- **U3 Phone rejects** — bare `1234567890` (no separator) → not PHONE; SSN pattern `123-45-6789` → not PHONE; IP `192.168.1.1` → not PHONE.
- **U4 Credit card valid** — `4111 1111 1111 1111` (Luhn ok) → CC.
- **U5 Credit card invalid** — `4111 1111 1111 1112` (Luhn fail) → not CC. 12‑digit / 20‑digit → not CC.
- **U6 SSN/ID** — `123-45-6789`, `123456789` → ID.
- **U7 IP valid/invalid** — `10.0.0.1` → IP; `999.1.1.1` → not IP.
- **U8 UK NINO** — `QQ123456C`, `AB 12 34 56 D` → NINO.
- **U9 API key** — `sk_5fA9…(20+)`, `bearer_…`, `token-…` → APIKEY; short `sk_abc` → not.

### Detection — expanded types
- **U10 Number ≥3 digits** — `12345`, `404-555-0147`, `1 2 3` → NUMBER.
- **U11 Number <3 ignored** — `25`, `7` → no NUMBER.
- **U12 Alphanumeric code** — `US-Z9876543`, `KP-9938210-09` → ALNUM. Plain word (no digit) → none.
- **U13 Address** — `1420 Peachtree St NE, Atlanta, GA 30309` → ADDRESS (includes street name).
- **U14 Name** — `Harrison Vance Caldwell` → NAME; `Global Mobility`, `Payroll Team`, `Dear Team` → not NAME (stopwords).
- **U15 Custom term** — supplied term matched case‑insensitively → CUSTOM.

### Dedup / priority / safety
- **U16 Email beats inner number/alnum** — digits inside an email aren't separately flagged.
- **U17 Address beats house number** — the whole address is one token, not the number alone.
- **U18 CC beats NUMBER** — 16‑digit card → CC, not NUMBER.
- **U19 Placeholder immunity** — text containing `[LDB_EMAIL_AB12_1]` → no finding overlaps the token (namespace digits/letters not re‑detected).
- **U20 Disabled categories** — `disabledTypes:["NUMBER"]` → no NUMBER findings; same honored by `maskText` and `computeLiveReplacement`.

### maskText
- **U21 Masks all + map** — multiple values → masked output + `replacements` map.
- **U22 Token reuse** — same value twice → same token.
- **U23 Exclude** — excluded value left in plaintext.
- **U24 Leaves existing placeholders intact.**
- **U25 Namespace token format** — `[LDB_EMAIL_<NS>_1]`.

### computeLiveReplacement (typing engine)
- **U26 Completed value, caret past it** → masked.
- **U27 Caret inside/at end of value** → left alone (`changed:false`).
- **U28 Caret at very start (caret≤index)** → masked.
- **U29 Offsets** — returned `start/end` map back to the original substring.
- **U30 Token reuse via existingMap.**
- **U31 Exclude set honored.**
- **U32 Caret adjusts** for length change of replacements before it.
- **U33 Multiple distinct values** in one pass.
- **U34 Empty / non‑string** → `changed:false`.
- **U35 Never re‑mask inside an existing placeholder.**

### restorePlaceholders
- **U36 Single token → value.**
- **U37 Every occurrence + count.**
- **U38 Unknown token untouched, count 0.**
- **U39 Map or plain object accepted.**
- **U40 Long multi‑line reply** with repeated tokens restores all.
- **U41 Round‑trip** — mask then restore == original.

### Tokens
- **U42 createPlaceholderToken** with/without namespace formats correctly.

---

## L2 — DOM integration (jsdom)

Load `detector.js` + `content.js` into a jsdom window with a stubbed `chrome`, on an AI host (`location.hostname = "chatgpt.com"`).

- **D1 Textarea live mask** — focus textarea, set value `"email a@b.com x"`, dispatch `input`, advance debounce → value becomes `"email [LDB_EMAIL_…] x"`, caret preserved.
- **D2 Caret guard** — caret inside the value being typed → not masked yet.
- **D3 Idle auto‑protect** — stop "typing", advance `IDLE_PROTECT_MS` → the trailing value masks.
- **D4 Paste #1 and #2** — dispatch `paste` then set value twice → both pastes mask (regression guard for the second‑paste bug).
- **D5 Send flush on Enter** — keydown Enter → any remaining value masked + retain‑note prepended once.
- **D6 Retain note once** — second send doesn't duplicate the note; no placeholders → no note.
- **D7 selfEdit guard** — our programmatic value change doesn't recurse / re‑trigger.
- **D8 Excluded value** — after "unprotect", value isn't re‑masked on next input.
- **D9 Non‑AI host** — on `example.com`, typing PII into a textarea is NOT auto‑masked.
- **D10 Restore mapping** — `restorePlaceholders` over assembled reply text returns real values (drives the panel state).
- **D11 GET_STATE shape** — message handler returns `{host, exposed, protected, session, transcript, customTerms,…}` grouped with counts.
- **D12 Per‑host map key** — `mappingSet` writes under `…::chatgpt.com`; loading a different host yields an empty map.
- **D13 Pause** — host in `pausedHosts` → `protectionActive()` false → no masking.
- **D14 Disabled category** — `detectNumbers:false` → numbers not masked while typing.

> Note: jsdom doesn't implement `execCommand`/contenteditable selection, so the contenteditable composer + caret are covered in **E2E**, not here.

---

## L3 — E2E (Playwright, real extension in Chromium)

Launch a persistent Chromium context with `--load-extension`. Fixture page `tests/e2e/fixture.html` provides: a `<textarea>` composer, a ProseMirror‑like `[role=textbox][contenteditable]` composer, a "send" button, and an `[data-message-author-role="assistant"]` region we can fill to simulate a reply. (Also run a subset against a real ChatGPT page in manual QA.)

### Masking
- **E1 Textarea masking** — type a value + space → placeholder appears in the textarea.
- **E2 Contenteditable masking** — type into the contenteditable composer → value replaced in place via Range; surrounding text intact; caret sane.
- **E3 Paste masking (both composers)** — paste a block with several PII → all masked; repeat paste → still masks.
- **E4 Idle auto‑protect** — type a value, wait → masks without pressing space/send.
- **E5 Send flush** — click the send button / press Enter → remaining value masked **and** the retain note is at the **top** of the sent text.
- **E6 Multiple occurrences** — same email twice → same token both places.

### Panel — in‑page overlay
- **E7 Auto‑open on detection** — typing PII slides the overlay in (AI host only).
- **E8 Four tabs** — Home / Custom words / Protected words / Settings present.
- **E9 In‑page icon toggles** — clicking the injected message‑row icon opens the overlay; clicking again closes it.
- **E10 Protected words list** — values grouped with `N×` counts; Unprotect reveals the value back into the composer; Forget removes the mapping.
- **E11 Exposed → Protect** — an exposed item's Protect button masks it.
- **E12 Custom words** — add a term → it's masked immediately in the field; remove → stops.
- **E13 Settings toggles** — turn Numbers off → numbers stop masking; Pause → masking stops; toggles persist across reload.
- **E14 Advanced disclosure** — stays open across re‑renders; input focus not stolen by polling.
- **E15 5s auto‑hide** — overlay closes ~5s after activity; stays while hovered; does NOT auto‑hide on Custom words / Settings.

### Panel — native side panel
- **E16 Toolbar icon opens native panel** — page genuinely resizes (push).
- **E17 Native panel mirrors content** — same tabs; reflects the active tab's field state via polling.
- **E18 Native panel actions** — protect/unprotect/forget/add‑term/clear all work over messaging.
- **E19 Overlay suppressed while native panel open** (PANEL_VISIBLE).

### Restore
- **E20 Reply restore (panel only)** — put tokens into the assistant region → Home tab shows the reply with **real values**; the page DOM still shows placeholders (never rewritten).
- **E21 Per‑block copy** — a fenced/`<pre>` block in the reply gets its own Copy that copies only that block.
- **E22 Formatting preserved** — headings/bullets/line breaks survive in the Home mirror (not one wall of text).
- **E23 Fragmented tokens** — a token split across `<strong>`/`<code>` is still reassembled and revealed in the panel.

### Scoping / safety
- **E24 Per‑host isolation** — protect on the fixture (host A) → open host B fixture → its panel is empty.
- **E25 Clear data** — clears only the current host's data.
- **E26 Synced‑surface guard** — Unprotect refuses to write a real value into a `[data-message-author-role]`/canvas/artifact element (toast instead).

---

## L4 — Manual QA (pre‑submit checklist)

Run on a fresh Chrome profile with the unpacked extension; reload the extension + hard‑refresh between checks.

### Real AI sites
- **M1 ChatGPT** — paste the demo prompt; verify email/phone/SSN/card/IP/API‑key/NINO mask; overlay opens; send keeps placeholders; reply restores in panel.
- **M2 Claude** — same core flow on `claude.ai` (composer masking + restore mirror).
- **M3 Gemini** — `gemini.google.com` composer masking (Quill editor) — note any editor fighting.
- **M4 Other AI hosts** — Perplexity / Copilot / Poe smoke check.

### Native side panel
- **M5 Toolbar icon** opens the pushing panel (window narrows); 4 tabs; data reflects active tab.
- **M6 Toggle close** — clicking toolbar icon again closes it (Chrome ≥ current).
- **M7 Context menu** — right‑click selection → "Protect with Ledebe" masks it.

### On‑send note
- **M8** Note appears at the **top** of the composer once PII is masked; the model keeps the `[LDB_…]` tokens in its reply (doesn't expand/flag).

### Scoping & persistence
- **M9 Cross‑site** — protect on ChatGPT, switch to a non‑AI tab and to Claude → no ChatGPT values shown.
- **M10 Remember across restarts** ON → close/reopen Chrome → prior chat still restores (same host). OFF → cleared on close.
- **M11 Clear saved data** clears only the current site.

### Robustness / privacy
- **M12 No network** — confirm (DevTools → Network) nothing is sent by the extension; values stay local.
- **M13 Extension reload mid‑session** — no console errors; page still usable.
- **M14 Non‑editable pages / login forms** — typing your email into a normal site login is NOT auto‑masked (only AI composers).
- **M15 Long document** — paste a 2–3 page doc → masks without freezing; placeholder cap (500) respected.
- **M16 Dark mode** — overlay + native panel render correctly in dark theme.
- **M17 Performance** — typing latency acceptable on a long ChatGPT conversation.

### Store‑readiness
- **M18 Screenshots match the shipped build** (4‑tab panel, real masking).
- **M19 Permissions justifications** match actual usage (`<all_urls>`, storage, contextMenus, sidePanel).
- **M20 Privacy policy URL** reachable and accurate ("no data collected / leaves device").

---

## Running

Everything runs from **`ledebe-browser-extension/`**. The E2E scripts delegate to the
repo-root Playwright (`npm --prefix ..`), so you don't switch directories.

```bash
cd ledebe-browser-extension
npm install              # adds jsdom (dev)

npm test                 # L1 + L2 → node --test (detector.test.js + content.dom.test.js)

npm run test:e2e:install # one-time: playwright install chromium (delegates to root)
npm run test:e2e         # L3 → real extension in Chromium against the routed fixture
```

> The root scripts still exist too (`npm run test:ext-e2e` from the repo root) — the
> extension scripts above just forward to them so you never hit a "wrong directory" error.

Files:
- L1 unit: `tests/detector.test.js`
- L2 harness + DOM: `tests/harness.js`, `tests/content.dom.test.js`
- L3 E2E: `e2e/playwright.config.ts`, `e2e/helpers.ts`, `e2e/fixture/ai-page.html`, `e2e/*.spec.ts`
- L4 manual: this file's M‑cases + the tracked matrix `qa-matrix.csv`

> The E2E routes `https://chatgpt.com/**` to a local fixture so `isAiHost()` is true.
> This is **regression coverage for the extension's own behaviour** — it is NOT proof
> against real‑host DOM drift. That is what the Release Gate's manual host smoke catches.

## Release Gate (must pass before any Web Store upload)

Run on a **fresh Chrome profile** with the unpacked extension (reload the card + hard‑refresh between checks):

1. **L1 + L2 green** (`npm test`) and **L3 green** (`npm run test:e2e`).
2. **Real‑host smoke on ChatGPT, Claude, and Gemini** (the only protection against DOM
   drift): composer masks in place, placeholders survive send, the reply restores in the
   panel, and there are no console errors.
3. **Native side panel** opens and pushes the page from the **toolbar icon**.
4. **No‑network check**: with DevTools → Network open, type/paste/send PII and confirm the
   extension transmits nothing.

If any host smoke fails (selectors changed upstream), fix selectors before submitting.

L4 is the `qa-matrix.csv` / M‑cases above — run the Manual rows before each submission.
