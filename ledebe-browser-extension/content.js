// Ledebe Browser Protector — content script
//
// Catches sensitive data (PII) as you TYPE or PASTE into AI chat composers and
// replaces each value with a placeholder live, the same way the prototype word
// replacer swapped words in the ChatGPT box. On send the text already carries
// placeholders, so your real data never leaves the page.
//
// A slide-in side panel lists every protected value and its placeholder; click
// a row to unprotect (reveal) or re-protect it. When the AI's reply echoes a
// placeholder, we reveal the real value back inside the answer.
//
// Detection + masking + restore live in detector.js (pure, unit-tested). This
// file is the DOM glue: read fields, apply replacements in place, draw the UI.

(() => {
  "use strict";

  // ---- settings -----------------------------------------------------------

  const DEFAULTS = {
    enabled: true,
    autoReplace: true,      // live-replace PII as you type/paste on AI sites
    scanOnPaste: true,
    restoreResponses: true, // reveal real values inside the AI's reply
    persistMappings: true,  // keep token→value map across browser restarts
    appendInstruction: true,// on send, ask the AI to keep [LDB_…] placeholders intact
    customTerms: [],
    pausedHosts: []
  };

  // Appended to a prompt on send (once, only when it contains placeholders) so
  // the model echoes the tokens verbatim and we can restore them in the reply.
  const RETAIN_MARKER = "[Ledebe note to the assistant:";
  const RETAIN_NOTE =
    "\n\n" + RETAIN_MARKER + " the bracketed tokens like [LDB_EMAIL_1] are"
    + " placeholders for redacted personal data. Keep every [LDB_…] token exactly"
    + " as written — do not alter, remove, translate, expand, or invent values"
    + " for them.]";

  let settings = { ...DEFAULTS };
  let activeEditable = null;

  // token → original value, for this session (persisted per `persistMappings`).
  const placeholderMap = new Map();
  // lowercased values the user chose to keep exposed (so we don't re-mask them).
  const unprotected = new Set();
  const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
  const LATEST_RESTORED_KEY = "ledebeLatestRestored";
  const MAX_PLACEHOLDERS = 500;

  const AI_HOST_PATTERNS = [
    "chatgpt.com",
    "chat.openai.com",
    "claude.ai",
    "anthropic.com",
    "gemini.google.com",
    "perplexity.ai",
    "copilot.microsoft.com",
    "poe.com",
    "you.com",
    "deepseek.com",
    "grok.com",
    "x.ai"
  ];

  // ---- extension-context-safe storage helpers -----------------------------

  function hasContext() {
    try {
      return Boolean(globalThis.chrome?.runtime?.id);
    } catch (error) {
      return false;
    }
  }

  function runtimeUrl(path) {
    try {
      return hasContext() ? chrome.runtime.getURL(path) : "";
    } catch (error) {
      return "";
    }
  }

  async function syncGet(defaults) {
    try {
      return hasContext() ? await chrome.storage.sync.get(defaults) : defaults;
    } catch (error) {
      return defaults;
    }
  }

  async function syncSet(value) {
    try {
      if (hasContext()) await chrome.storage.sync.set(value);
    } catch (error) {
      /* ignore */
    }
  }

  function mappingStore() {
    return settings.persistMappings ? chrome.storage?.local : chrome.storage?.session;
  }

  async function mappingGet() {
    try {
      const store = mappingStore();
      if (!hasContext() || !store) return {};
      const data = await store.get(PLACEHOLDER_STORAGE_KEY);
      return data[PLACEHOLDER_STORAGE_KEY] || {};
    } catch (error) {
      return {};
    }
  }

  function mappingSet() {
    try {
      const store = mappingStore();
      if (hasContext() && store) {
        void store.set({ [PLACEHOLDER_STORAGE_KEY]: Object.fromEntries(placeholderMap) });
      }
    } catch (error) {
      /* ignore */
    }
  }

  function publishRestored(text) {
    try {
      if (hasContext() && chrome.storage?.session) {
        void chrome.storage.session.set({
          [LATEST_RESTORED_KEY]: { host: getHost(), text, ts: Date.now() }
        });
      }
    } catch (error) {
      /* ignore */
    }
  }

  // ---- host / frame helpers ------------------------------------------------

  function getHost() {
    return window.location.hostname;
  }

  function isAiHost() {
    const host = getHost();
    return AI_HOST_PATTERNS.some((pattern) => host.includes(pattern));
  }

  function isPaused() {
    return settings.pausedHosts.includes(getHost());
  }

  function isTopFrame() {
    try {
      return window.self === window.top;
    } catch (error) {
      return false;
    }
  }

  function protectionActive() {
    return settings.enabled && !isPaused();
  }

  // ---- editable element resolution ----------------------------------------

  function isInsideLedebeUi(node) {
    return Boolean(node instanceof Node && drawer && drawer.contains(node));
  }

  function isEditableElement(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (node instanceof HTMLTextAreaElement) return true;
    if (node instanceof HTMLInputElement) {
      return ["text", "search", "email", "url", "tel", "password"].includes(node.type || "text");
    }
    return node.isContentEditable;
  }

  // The real composer in a rich AI editor is the [role=textbox] node; resolve to
  // it so we read/write the right element (ChatGPT/Claude/Gemini ProseMirror).
  function getComposer(node) {
    if (!(node instanceof HTMLElement)) return null;
    const selector = '[role="textbox"][contenteditable="true"], [role="textbox"][contenteditable=""]';
    if (node.matches(selector)) return node;
    return node.closest?.(selector) || node.querySelector?.(selector) || null;
  }

  function editableRoot(node) {
    if (!(node instanceof HTMLElement)) return null;
    const composer = getComposer(node);
    if (composer) return composer;
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) return node;
    if (!node.isContentEditable) return null;

    // Climb to the outermost contenteditable host.
    let root = node;
    let current = node.parentElement;
    while (current && current !== document.body && current.isContentEditable && !isInsideLedebeUi(current)) {
      root = current;
      current = current.parentElement;
    }
    return root;
  }

  function resolveEditable(node) {
    let current = node instanceof HTMLElement ? node : node?.parentElement || null;
    while (current) {
      if (isInsideLedebeUi(current)) return null;
      if (isEditableElement(current)) return editableRoot(current) || current;
      current = current.parentElement;
    }
    return null;
  }

  function isPlainField(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
  }

  // A surface whose content the AI app syncs back to its servers or treats as
  // model context: the editable Canvas / artifact / textdoc, or an AI message
  // bubble. Writing a *real* value into one of these could send it to the AI, so
  // we never reveal (unprotect) into them — the prompt composer is the only
  // editable place real values are allowed, and even then only by the user.
  function isSyncedDocSurface(element) {
    const box = getComposer(element) || element;
    if (!(box instanceof HTMLElement)) return false;
    return Boolean(box.closest(
      '[data-message-author-role], [data-testid*="canvas"], [class*="canvas"], '
      + '[class*="artifact"], [class*="textdoc"], [data-testid*="artifact"], article'
    ));
  }

  // ---- read / write field text --------------------------------------------

  function getComposerText(element) {
    const box = getComposer(element) || element;
    if (!(box instanceof HTMLElement)) return "";
    const clone = box.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return box.innerText || box.textContent || "";
    clone.querySelectorAll('button, svg, img, [aria-hidden="true"], [contenteditable="false"]').forEach((n) => n.remove());
    clone.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
    for (const block of clone.querySelectorAll("p, div, li")) {
      if (!block.textContent?.endsWith("\n")) block.append("\n");
    }
    return (clone.innerText || clone.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function getFieldText(element) {
    if (!element) return "";
    if (isPlainField(element)) return element.value || "";
    if (getComposer(element)) return getComposerText(element);
    return element.innerText || element.textContent || "";
  }

  // Set a plain field's value through the native setter so frameworks notice.
  function setPlainValue(element, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ---- caret helpers -------------------------------------------------------

  function getCaret(element) {
    if (isPlainField(element)) return element.selectionStart ?? element.value.length;
    const box = getComposer(element) || element;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!box.contains(range.endContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(box);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  }

  function rangeFromOffsets(root, start, end) {
    const range = document.createRange();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let count = 0;
    let node;
    let startSet = false;
    range.setStart(root, 0);
    while ((node = walker.nextNode())) {
      const len = node.nodeValue.length;
      if (!startSet && count + len >= start) {
        range.setStart(node, start - count);
        startSet = true;
      }
      if (count + len >= end) {
        range.setEnd(node, end - count);
        return range;
      }
      count += len;
    }
    range.setEnd(root, root.childNodes.length);
    return range;
  }

  function setCaret(root, offset) {
    try {
      const sel = window.getSelection();
      const range = rangeFromOffsets(root, offset, offset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (error) {
      /* ignore */
    }
  }

  // ---- placeholder map bookkeeping ----------------------------------------

  function loadMap(data) {
    placeholderMap.clear();
    for (const [token, original] of Object.entries(data || {})) {
      if (token && typeof original === "string") placeholderMap.set(token, original);
    }
  }

  function rememberReplacements(replacements) {
    let changed = false;
    for (const { token, original } of replacements || []) {
      if (!token || typeof original !== "string") continue;
      if (placeholderMap.get(token) === original) continue;
      placeholderMap.delete(token);
      placeholderMap.set(token, original);
      while (placeholderMap.size > MAX_PLACEHOLDERS) {
        const oldest = placeholderMap.keys().next().value;
        if (!oldest) break;
        placeholderMap.delete(oldest);
      }
      changed = true;
    }
    if (changed) mappingSet();
  }

  function placeholderNamespace() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ---- live replace engine (type / paste) ---------------------------------

  let selfEdit = false;      // true while WE edit the field, to ignore our events
  let scanTimer = null;
  let scanTarget = null;
  let idleProtectTimer = null;
  const IDLE_PROTECT_MS = 800;

  function scheduleScan(element, delay = 70) {
    scanTarget = element;
    if (scanTimer) return;
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      const target = scanTarget;
      scanTarget = null;
      if (target) {
        try {
          liveReplace(target);
        } catch (error) {
          console.debug("[Ledebe]", error);
        }
      }
    }, delay);
  }

  // Auto-protect: after a short pause in typing, mask everything still detected
  // — including the value the caret is sitting on, which the live scan leaves
  // alone so it isn't clobbered mid-keystroke. This is what makes protection
  // hands-off: no need to click "Protect" or even reach the send button.
  function scheduleIdleProtect(element) {
    if (idleProtectTimer) clearTimeout(idleProtectTimer);
    idleProtectTimer = window.setTimeout(() => {
      idleProtectTimer = null;
      try {
        liveReplace(element, true);
      } catch (error) {
        console.debug("[Ledebe]", error);
      }
    }, IDLE_PROTECT_MS);
  }

  // Replace every newly-completed PII value in `element` with a placeholder.
  // `force` ignores the caret guard (used right before send) so the value the
  // user just finished typing is also masked. Returns true if anything changed.
  function liveReplace(element, force = false) {
    if (!element || selfEdit || !protectionActive() || !settings.autoReplace) return false;
    if (!isAiHost()) return false; // only auto-mutate AI composers, never arbitrary forms

    const counters = new Map();
    const options = {
      customTerms: settings.customTerms,
      exclude: unprotected,
      existingMap: placeholderMap,
      counters,
      namespace: placeholderNamespace()
    };

    if (isPlainField(element)) {
      const caret = force ? null : element.selectionStart;
      const result = computeLiveReplacement(element.value, caret, options);
      if (!result.changed) return false;
      selfEdit = true;
      try {
        setPlainValue(element, result.text);
        element.selectionStart = element.selectionEnd = result.caret;
        rememberReplacements(result.replacements);
        flashField(element);
      } finally {
        window.setTimeout(() => { selfEdit = false; }, 0);
      }
      afterProtect(element);
      return true;
    }

    // Rich contenteditable composer: detect over the raw text-node string and
    // replace each match in place via a Range, exactly like the prototype, so
    // ProseMirror keeps its model and surrounding formatting intact.
    const box = getComposer(element) || element;
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    let full = "";
    let n;
    while ((n = walker.nextNode())) full += n.nodeValue;
    if (!full) return false;

    const caret = force ? null : getCaret(box);
    const result = computeLiveReplacement(full, caret, options);
    if (!result.changed) return false;

    const sel = window.getSelection();
    selfEdit = true;
    try {
      for (let i = result.replacements.length - 1; i >= 0; i -= 1) {
        const item = result.replacements[i];
        const range = rangeFromOffsets(box, item.start, item.end);
        sel.removeAllRanges();
        sel.addRange(range);
        if (!document.execCommand("insertText", false, item.token)) {
          range.deleteContents();
          range.insertNode(document.createTextNode(item.token));
        }
      }
      if (typeof result.caret === "number") setCaret(box, result.caret);
      rememberReplacements(result.replacements);
    } finally {
      window.setTimeout(() => { selfEdit = false; }, 0);
    }
    afterProtect(element);
    return true;
  }

  function afterProtect(element) {
    activeEditable = element;
    refreshDrawer();
    maybeOpenDrawer();
  }

  function flashField(element) {
    element.classList.add("ledebe-flash");
    window.setTimeout(() => element.classList.remove("ledebe-flash"), 320);
  }

  // ---- per-item protect / unprotect (drawer actions) ----------------------

  function placeholderPrefixFor(value) {
    const finding = detectPII(value, []).find((f) => f.value === value);
    return finding ? finding.prefix : "LDB_CUSTOM";
  }

  function protectValue(value) {
    const element = activeEditable;
    if (!element) return;
    unprotected.delete(value.toLowerCase());

    const original = getFieldText(element);
    const token = createPlaceholderToken(placeholderPrefixFor(value), placeholderNamespace(), 1);
    const regex = new RegExp(escapeRegExp(value), "g");
    let replaced = false;
    const masked = original.replace(regex, () => { replaced = true; return token; });
    if (!replaced) {
      refreshDrawer();
      return;
    }

    rememberReplacements([{ token, original: value }]);
    applyFieldText(element, masked);
    afterProtect(element);
  }

  function unprotectToken(token) {
    const element = activeEditable;
    if (!element) return;
    const original = placeholderMap.get(token);
    if (typeof original !== "string") return;

    // Never write a real value into a surface the AI app syncs (Canvas, artifact,
    // message). The value stays visible in this panel only.
    if (isSyncedDocSurface(element)) {
      toast("Revealing here could send it to the AI. The real value stays in this panel only.");
      refreshDrawer();
      return;
    }

    const current = getFieldText(element);
    if (!current.includes(token)) {
      refreshDrawer();
      return;
    }
    const next = current.replace(new RegExp(escapeRegExp(token), "g"), original);
    unprotected.add(original.toLowerCase()); // don't immediately re-mask it
    applyFieldText(element, next);
    afterProtect(element);
  }

  // Drop a mapping from the session map (it's no longer in any field). Stops it
  // being restored in future replies; does not touch the page.
  function forgetToken(token) {
    const value = placeholderMap.get(token);
    placeholderMap.delete(token);
    if (typeof value === "string") unprotected.delete(value.toLowerCase());
    mappingSet();
    refreshDrawer();
  }

  // Whole-field write used by per-item toggles + manual protect. For rich
  // composers we select-all then insertText so the editor reconciles cleanly.
  function applyFieldText(element, value) {
    selfEdit = true;
    try {
      if (isPlainField(element)) {
        setPlainValue(element, value);
      } else {
        const box = getComposer(element) || element;
        box.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(box);
        sel.removeAllRanges();
        sel.addRange(range);
        if (!document.execCommand("insertText", false, value)) {
          box.textContent = value;
        }
        box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      }
    } finally {
      window.setTimeout(() => { selfEdit = false; }, 0);
    }
  }

  // Manual "protect this field" (popup button / context menu) — masks all PII
  // regardless of host, ignoring the caret guard.
  function protectActiveField() {
    if (!activeEditable) {
      toast("Click into a text field first.");
      return;
    }
    const original = getFieldText(activeEditable);
    const result = maskText(original, settings.customTerms, {
      namespace: placeholderNamespace(),
      exclude: unprotected
    });
    if (!result.replacements.length) {
      toast("Nothing sensitive found in this field.");
      return;
    }
    rememberReplacements(result.replacements);
    applyFieldText(activeEditable, result.masked);
    afterProtect(activeEditable);
    toast(`Protected ${result.replacements.length} item${result.replacements.length === 1 ? "" : "s"}.`);
    openDrawer();
  }

  // ---- detection (for the "exposed" list + counts) ------------------------

  function exposedItems(text) {
    if (!text) return [];
    const seen = new Set();
    const items = [];
    for (const finding of detectPII(text, settings.customTerms)) {
      if (finding.value.startsWith("[LDB_")) continue;
      const key = finding.value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ value: finding.value, label: finding.label });
    }
    return items;
  }

  function protectedItems(text) {
    if (!text) return [];
    const seen = new Set();
    const items = [];
    const regex = /\[LDB_[A-Z0-9_]+\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      if (seen.has(token)) continue;
      seen.add(token);
      const original = placeholderMap.get(token);
      if (typeof original === "string") items.push({ token, value: original });
    }
    return items;
  }

  // ---- slide-in side panel (drawer) ---------------------------------------

  let drawer = null;
  let drawerOpen = false;
  let drawerDismissed = false;
  let latestRestoredText = "";
  let activeTab = "field"; // "home" | "words" | "field"

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  }

  function ensureDrawer() {
    if (drawer && document.documentElement.contains(drawer)) return drawer;
    drawer = document.createElement("aside");
    drawer.className = "ledebe-drawer";
    drawer.innerHTML = `
      <header class="ledebe-drawer__head">
        <div class="ledebe-drawer__brand">
          <img class="ledebe-drawer__logo" alt="" />
          <div>
            <strong>Ledebe Protector</strong>
            <span class="ledebe-drawer__sub"></span>
          </div>
        </div>
        <button type="button" class="ledebe-drawer__close" aria-label="Close">×</button>
      </header>
      <nav class="ledebe-tabs">
        <button type="button" class="ledebe-tab" data-tab="home">Home</button>
        <button type="button" class="ledebe-tab" data-tab="words">Custom words</button>
        <button type="button" class="ledebe-tab" data-tab="field">This field</button>
      </nav>
      <div class="ledebe-drawer__body"></div>
    `;
    const logo = drawer.querySelector(".ledebe-drawer__logo");
    const logoUrl = runtimeUrl("ledebe-icon.png");
    if (logoUrl) logo.src = logoUrl; else logo.remove();

    drawer.addEventListener("pointerdown", (event) => event.stopPropagation(), true);
    drawer.querySelector(".ledebe-drawer__close").addEventListener("click", () => {
      drawerDismissed = true;
      closeDrawer();
    });
    drawer.querySelectorAll(".ledebe-tab").forEach((btn) => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
    });

    document.documentElement.appendChild(drawer);
    return drawer;
  }

  function setActiveTab(tab) {
    activeTab = tab;
    refreshDrawer();
  }

  function sectionEl(title) {
    const el = document.createElement("div");
    el.className = "ledebe-drawer__section";
    el.textContent = title;
    return el;
  }

  function leadEl(text) {
    const el = document.createElement("p");
    el.className = "ledebe-drawer__lead";
    el.textContent = text;
    return el;
  }

  function emptyEl(text) {
    const el = document.createElement("p");
    el.className = "ledebe-drawer__empty";
    el.textContent = text;
    return el;
  }

  function rowEl(kind, primary, secondary, action, onClick) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `ledebe-row ledebe-row--${kind}`;
    row.innerHTML = `
      <span class="ledebe-row__dot"></span>
      <span class="ledebe-row__text">
        <span class="ledebe-row__value">${escapeHtml(primary)}</span>
        <span class="ledebe-row__meta">${escapeHtml(secondary)}</span>
      </span>
      <span class="ledebe-row__action">${escapeHtml(action)}</span>
    `;
    row.addEventListener("click", onClick);
    return row;
  }

  function copyButton(label, getText) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ledebe-drawer__copy";
    btn.textContent = label;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(getText());
        btn.textContent = "Copied";
        setTimeout(() => { btn.textContent = label; }, 1200);
      } catch (error) {
        /* clipboard blocked */
      }
    });
    return btn;
  }

  // ---- Home tab: the chat, mirrored with real values restored -------------

  function collectRestoredTranscript() {
    const turns = [];
    for (const el of document.querySelectorAll("[data-message-author-role]")) {
      if (isInsideLedebeUi(el)) continue;
      const raw = el.innerText || el.textContent || "";
      if (!raw.trim()) continue;
      let text = restorePlaceholders(raw, placeholderMap).restored;
      const note = text.indexOf(RETAIN_MARKER); // hide our injected on-send note
      if (note !== -1) text = text.slice(0, note).trim();
      if (!text) continue;
      turns.push({ role: el.getAttribute("data-message-author-role") || "user", text });
    }
    return turns;
  }

  function renderHomePane(body) {
    body.appendChild(leadEl("Your chat with real values restored — shown only here. The page itself keeps the placeholders."));

    const turns = collectRestoredTranscript();
    if (!turns.length) {
      if (latestRestoredText) {
        const pre = document.createElement("pre");
        pre.className = "ledebe-drawer__restored";
        pre.textContent = latestRestoredText;
        body.appendChild(pre);
        body.appendChild(copyButton("Copy restored reply", () => latestRestoredText));
      } else {
        body.appendChild(emptyEl("No restored content yet. Send a protected prompt and the chat will mirror here with your real values."));
      }
      return;
    }

    for (const turn of turns) {
      const msg = document.createElement("div");
      msg.className = `ledebe-msg ledebe-msg--${turn.role === "assistant" ? "assistant" : "user"}`;
      const who = document.createElement("div");
      who.className = "ledebe-msg__role";
      who.textContent = turn.role === "assistant" ? "Assistant" : "You";
      const text = document.createElement("div");
      text.className = "ledebe-msg__text";
      text.textContent = turn.text;
      msg.append(who, text);
      body.appendChild(msg);
    }

    body.appendChild(copyButton("Copy restored transcript", () =>
      turns.map((t) => `${t.role === "assistant" ? "Assistant" : "You"}:\n${t.text}`).join("\n\n")));
  }

  // ---- Custom words tab ----------------------------------------------------

  function addCustomTerm(term) {
    const terms = [...(settings.customTerms || [])];
    if (!term || terms.some((t) => t.toLowerCase() === term.toLowerCase())) return;
    terms.push(term);
    settings.customTerms = terms;
    unprotected.delete(term.toLowerCase());
    void syncSet({ customTerms: terms });
    if (activeEditable) liveReplace(activeEditable, true); // protect it right away
    refreshDrawer();
  }

  function removeCustomTerm(term) {
    settings.customTerms = (settings.customTerms || []).filter((t) => t.toLowerCase() !== term.toLowerCase());
    void syncSet({ customTerms: settings.customTerms });
    refreshDrawer();
  }

  function renderWordsPane(body) {
    body.appendChild(leadEl("Always protect these words — names, project codes, client terms. They get masked just like detected PII."));

    const add = document.createElement("div");
    add.className = "ledebe-words__add";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "ledebe-words__input";
    input.placeholder = "Add a word or phrase…";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ledebe-words__btn";
    btn.textContent = "Add";
    const submit = () => { const v = input.value.trim(); if (v) { addCustomTerm(v); } };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    add.append(input, btn);
    body.appendChild(add);

    const terms = settings.customTerms || [];
    if (!terms.length) {
      body.appendChild(emptyEl("No custom words yet."));
      return;
    }
    body.appendChild(sectionEl(`Custom words (${terms.length})`));
    for (const term of terms) {
      body.appendChild(rowEl("protected", term, "custom word", "Remove", () => removeCustomTerm(term)));
    }
  }

  // ---- This-field tab: live protected / exposed list -----------------------

  function renderFieldPane(body) {
    const text = getFieldText(activeEditable);
    const prot = protectedItems(text);
    const exposed = exposedItems(text);

    if (exposed.length) {
      body.appendChild(sectionEl(`Exposed (${exposed.length})`));
      for (const item of exposed) {
        body.appendChild(rowEl("exposed", item.value, `${item.label} · protecting…`, "Protect",
          () => protectValue(item.value)));
      }
    }

    if (prot.length) {
      body.appendChild(sectionEl(`Protected (${prot.length})`));
      for (const item of prot) {
        body.appendChild(rowEl("protected", item.value, item.token, "Unprotect",
          () => unprotectToken(item.token)));
      }
    }

    const fieldTokens = new Set(prot.map((item) => item.token));
    const sessionEntries = [...placeholderMap.entries()].filter(([token]) => !fieldTokens.has(token));
    if (sessionEntries.length) {
      body.appendChild(sectionEl(`Protected this session (${sessionEntries.length})`));
      for (const [token, value] of sessionEntries) {
        body.appendChild(rowEl("protected", value, token, "Forget", () => forgetToken(token)));
      }
    }

    if (!prot.length && !exposed.length && !sessionEntries.length) {
      body.appendChild(emptyEl("No sensitive data detected in this field."));
    }
  }

  function refreshDrawer() {
    if (!drawerOpen || !drawer) return;
    drawer.querySelector(".ledebe-drawer__sub").textContent =
      `${placeholderMap.size} value${placeholderMap.size === 1 ? "" : "s"} protected this session`;
    drawer.querySelectorAll(".ledebe-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === activeTab));

    const body = drawer.querySelector(".ledebe-drawer__body");
    body.innerHTML = "";
    if (activeTab === "home") renderHomePane(body);
    else if (activeTab === "words") renderWordsPane(body);
    else renderFieldPane(body);
  }

  // Shift the page over so the docked panel doesn't cover the chat.
  function applyPagePush(width) {
    const html = document.documentElement;
    html.style.transition = "margin-right 0.26s cubic-bezier(0.22, 1, 0.36, 1)";
    html.style.marginRight = width ? `${width}px` : "";
  }

  function openDrawer() {
    const el = ensureDrawer();
    drawerOpen = true;
    refreshDrawer();
    // Commit the off-screen start state (translateX) before flipping to open, so
    // the slide actually animates. A single requestAnimationFrame on a freshly
    // inserted node can be collapsed by the browser, skipping the transition.
    void el.offsetWidth;
    el.classList.add("is-open");
    applyPagePush(el.offsetWidth);
  }

  function closeDrawer() {
    drawerOpen = false;
    if (drawer) drawer.classList.remove("is-open");
    applyPagePush(0);
  }

  function maybeOpenDrawer() {
    if (!protectionActive() || !isAiHost() || drawerDismissed) {
      if (drawerOpen) refreshDrawer();
      return;
    }
    const text = getFieldText(activeEditable);
    if (protectedItems(text).length || exposedItems(text).length) {
      if (drawerOpen) {
        refreshDrawer();
      } else {
        activeTab = "field";
        openDrawer();
      }
    } else if (drawerOpen) {
      refreshDrawer();
    }
  }

  // ---- toast ---------------------------------------------------------------

  function toast(message) {
    document.querySelector(".ledebe-toast")?.remove();
    const node = document.createElement("div");
    node.className = "ledebe-toast";
    node.textContent = message;
    document.documentElement.appendChild(node);
    window.setTimeout(() => node.remove(), 2400);
  }

  // ---- AI response restoration --------------------------------------------
  // Watch for our placeholders appearing in the AI's reply and reveal the real
  // values — but ONLY in our own side panel. We deliberately never write the
  // real values back into the page DOM: that would flicker against the site's
  // re-render, and (defensively) avoids any chance of the values re-entering an
  // app that serialises its next request from the DOM. The page keeps showing
  // placeholders; the panel shows the restored reply with a Copy button.

  const ASSISTANT_SELECTORS =
    '[data-message-author-role="assistant"], [data-message-author="assistant"], '
    + '.model-response-text, message-content, [data-testid="model-response"], '
    + 'div.agent-turn, .markdown.prose';
  const TURN_MARKERS =
    '[data-message-author-role], [data-message-author], message-content, .model-response-text';
  const SETTLE_MS = 350;

  let responseObserver = null;
  let settleTimer = null;
  const dirtyRoots = new Set();
  let usesTurnRoles = null;

  function restoreActive() {
    return Boolean(
      settings.enabled && settings.restoreResponses && !isPaused()
      && isTopFrame() && placeholderMap.size > 0 && document.body
    );
  }

  function pageUsesTurnRoles() {
    if (usesTurnRoles === null) usesTurnRoles = Boolean(document.querySelector(TURN_MARKERS));
    return usesTurnRoles;
  }

  function isExcludedRegion(node) {
    const el = node instanceof HTMLElement ? node : node?.parentElement;
    if (!el) return true;
    if (isInsideLedebeUi(el)) return true;
    if (el.closest(".ledebe-toast, .ledebe-drawer")) return true;
    if (el.closest('input, textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"]')) return true;
    if (pageUsesTurnRoles() && !el.closest(ASSISTANT_SELECTORS)) return true;
    return false;
  }

  // Build the fully-restored text for a container from its combined innerText.
  // innerText reassembles a token even when the page split it across <strong>/
  // <code>/<em> boundaries (common in long markdown replies), so this reveals
  // placeholders that the in-place text-node restore cannot reach.
  function restoredTextForContainer(container) {
    if (!(container instanceof HTMLElement)) return { text: "", count: 0 };
    const raw = container.innerText || container.textContent || "";
    const { restored, restoredCount } = restorePlaceholders(raw, placeholderMap);
    return { text: restored.trim(), count: restoredCount };
  }

  // Surface the best (most-restored) reply in the side panel and persist it.
  function reportRestored(containers) {
    let best = null;
    for (const container of containers) {
      const result = restoredTextForContainer(container);
      if (result.count > 0 && (!best || result.count >= best.count)) best = result;
    }
    if (!best || !best.text) return;
    latestRestoredText = best.text;
    publishRestored(best.text);
    if (drawerOpen) {
      refreshDrawer();
    } else if (isAiHost() && !drawerDismissed) {
      activeTab = "home"; // a reply arrived — land on the chat mirror
      openDrawer();
    }
  }

  function processDirty() {
    settleTimer = null;
    usesTurnRoles = null;
    if (!restoreActive()) {
      dirtyRoots.clear();
      return;
    }
    const roots = Array.from(dirtyRoots);
    dirtyRoots.clear();

    // Read-only: find the assistant turns that hold a token and reassemble their
    // restored text for the panel. The page DOM is never modified.
    const containers = new Set();
    for (const root of roots) {
      if (!(root instanceof HTMLElement) || !root.isConnected) continue;
      const container = root.closest(ASSISTANT_SELECTORS) || root;
      if (container && container !== document.body && (container.innerText || "").indexOf("[LDB_") !== -1) {
        containers.add(container);
      }
    }
    reportRestored(containers);
  }

  function queueRoot(root) {
    if (!(root instanceof HTMLElement) || isExcludedRegion(root)) return false;
    dirtyRoots.add(root);
    return true;
  }

  function scheduleSettle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(processDirty, SETTLE_MS);
  }

  function onResponseMutations(records) {
    if (!restoreActive()) return;
    let queued = false;
    for (const record of records) {
      if (record.type === "characterData") {
        if (record.target?.textContent?.indexOf("[LDB_") !== -1) {
          queued = queueRoot(record.target.parentElement) || queued;
        }
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent?.indexOf("[LDB_") !== -1) queued = queueRoot(node.parentElement) || queued;
        } else if (node instanceof HTMLElement && node.textContent?.indexOf("[LDB_") !== -1) {
          queued = queueRoot(node) || queued;
        }
      }
    }
    if (queued) scheduleSettle();
  }

  function sweepResponses() {
    if (!restoreActive()) return;
    usesTurnRoles = null;
    let queued = false;
    if (pageUsesTurnRoles()) {
      for (const el of document.querySelectorAll(ASSISTANT_SELECTORS)) queued = queueRoot(el) || queued;
    } else {
      queued = queueRoot(document.body);
    }
    if (queued) scheduleSettle();
  }

  function startResponseObserver() {
    if (responseObserver || !isTopFrame() || !document.body) return;
    responseObserver = new MutationObserver(onResponseMutations);
    responseObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
    sweepResponses();
    setTimeout(sweepResponses, 1200);
    setTimeout(sweepResponses, 3000);
  }

  // ---- event wiring --------------------------------------------------------

  function trackTarget(event) {
    const target = resolveEditable(event.target);
    if (target) {
      if (target !== activeEditable) drawerDismissed = false;
      activeEditable = target;
    }
    return target;
  }

  function onFocusIn(event) {
    trackTarget(event);
  }

  function onInput(event) {
    if (selfEdit) return;
    const target = trackTarget(event);
    if (!target) return;
    scheduleScan(target, 90);
    scheduleIdleProtect(target);
    maybeOpenDrawer();
  }

  function onPaste(event) {
    if (selfEdit || !settings.scanOnPaste) return;
    const target = trackTarget(event);
    if (!target) return;
    // Let the paste land first, then scan + auto-protect the resulting text.
    window.setTimeout(() => {
      scheduleScan(target, 40);
      scheduleIdleProtect(target);
    }, 10);
  }

  // Right before send (Enter / send button), force-mask anything still exposed.
  function flushBeforeSend() {
    const target = activeEditable || resolveEditable(document.activeElement);
    if (!target) return;
    activeEditable = target;
    liveReplace(target, true);
    appendRetainInstruction(target);
  }

  // Append the "keep the placeholders" note to the prompt, once, and only when
  // the prompt actually contains placeholders. Goes into the composer text so it
  // is sent to the AI alongside the masked prompt.
  function appendRetainInstruction(element) {
    if (!settings.appendInstruction || !element) return;
    if (!isPlainField(element) && !element.isContentEditable && !getComposer(element)) return;
    const text = getFieldText(element);
    if (!text.includes("[LDB_") || text.includes(RETAIN_MARKER)) return;

    selfEdit = true;
    try {
      if (isPlainField(element)) {
        setPlainValue(element, text + RETAIN_NOTE);
        element.selectionStart = element.selectionEnd = element.value.length;
      } else {
        const box = getComposer(element) || element;
        box.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(box);
        range.collapse(false); // caret to end
        sel.removeAllRanges();
        sel.addRange(range);
        if (!document.execCommand("insertText", false, RETAIN_NOTE)) {
          box.textContent = text + RETAIN_NOTE;
        }
        box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: RETAIN_NOTE }));
      }
    } finally {
      window.setTimeout(() => { selfEdit = false; }, 0);
    }
  }

  function onKeyDown(event) {
    if (!isAiHost() || event.defaultPrevented || event.isComposing) return;
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    flushBeforeSend();
  }

  function isSendTrigger(el) {
    if (!(el instanceof HTMLElement)) return false;
    const button = el.closest('button, [role="button"], [type="submit"]');
    if (!button) return false;
    const label = `${button.getAttribute("aria-label") || ""} ${button.dataset.testid || ""} ${button.textContent || ""}`.toLowerCase();
    return /\b(send|submit|ask|message)\b/.test(label);
  }

  function onPointerDown(event) {
    if (isAiHost() && isSendTrigger(event.target)) flushBeforeSend();
  }

  function onSubmit(event) {
    if (!isAiHost() || isPaused()) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const field = activeEditable && form.contains(activeEditable) ? activeEditable
      : Array.from(form.querySelectorAll('textarea, input, [contenteditable="true"], [role="textbox"]')).find(isEditableElement);
    if (field) {
      activeEditable = field;
      liveReplace(field, true);
    }
  }

  // ---- settings + messages -------------------------------------------------

  async function loadSettings() {
    settings = { ...DEFAULTS, ...(await syncGet(DEFAULTS)) };
  }

  function wireRuntime() {
    if (!hasContext()) return;

    chrome.storage.onChanged.addListener((changes, area) => {
      if ((area === "local" || area === "session") && changes[PLACEHOLDER_STORAGE_KEY]) {
        const expected = settings.persistMappings ? "local" : "session";
        if (area === expected) {
          loadMap(changes[PLACEHOLDER_STORAGE_KEY].newValue || {});
          sweepResponses();
          if (drawerOpen) refreshDrawer();
        }
        return;
      }
      if (area !== "sync") return;
      for (const [key, value] of Object.entries(changes)) settings[key] = value.newValue;
      if (activeEditable) refreshDrawer();
      startResponseObserver();
      sweepResponses();
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message?.type) {
        case "GET_PAGE_STATE": {
          const text = getFieldText(activeEditable);
          sendResponse({
            host: getHost(),
            enabled: settings.enabled,
            paused: isPaused(),
            exposed: exposedItems(text).length,
            protectedCount: protectedItems(text).length
          });
          return true;
        }
        case "PROTECT_ACTIVE_FIELD":
          protectActiveField();
          sendResponse({ ok: true });
          return true;
        case "OPEN_PANEL":
          drawerDismissed = false;
          openDrawer();
          sendResponse({ ok: true });
          return true;
        default:
          return false;
      }
    });
  }

  // ---- init ----------------------------------------------------------------

  if (!isTopFrame()) {
    // Only run in the top frame; AI composers and replies live there.
    return;
  }

  wireRuntime();

  loadSettings()
    .then(async () => loadMap(await mappingGet()))
    .then(() => {
      document.addEventListener("focusin", onFocusIn, true);
      document.addEventListener("input", onInput, true);
      document.addEventListener("paste", onPaste, true);
      document.addEventListener("keydown", onKeyDown, true);
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("submit", onSubmit, true);
      startResponseObserver();
    });
})();
