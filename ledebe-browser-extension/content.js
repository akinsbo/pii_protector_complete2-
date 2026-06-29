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
    // Advanced: aggressive detection categories (all on by default).
    detectNames: true,
    detectNumbers: true,
    detectAddresses: true,
    detectCodes: true,
    customTerms: [],
    personalTerms: [],
    pausedHosts: [],
    subscriptionPlan: "free"
  };

  const COMPANY_TERMS_STORAGE_KEY = "ledebeCompanyTerms";
  const COMPANY_STATE_STORAGE_KEY = "ledebeCompanyState";
  const COMPANY_API_BASE = "https://m9ur273451.execute-api.us-east-2.amazonaws.com";
  const FEEDBACK_ENDPOINT = "https://formspree.io/f/xdkogqpv";
  const PERSONAL_TERM_LIMITS = {
    free: 20,
    pro: Infinity,
    team: Infinity,
    enterprise: Infinity
  };
  const i18n = globalThis.LEDEBE_I18N || { t: (_key, fallback, values) => {
    if (!values) return fallback;
    return String(fallback || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  } };
  const t = (key, fallback, values) => i18n.t(key, fallback, values);

  // Map the category toggles to the detector rule names to skip when off.
  function disabledTypes() {
    const off = [];
    if (settings.detectNames === false) off.push("NAME");
    if (settings.detectNumbers === false) off.push("NUMBER");
    if (settings.detectAddresses === false) off.push("ADDRESS");
    if (settings.detectCodes === false) off.push("ALNUM");
    return off;
  }

  // Prepended to a prompt on send (once, only when it contains placeholders) so
  // the model sees the instruction first and echoes the tokens verbatim.
  const RETAIN_MARKER = "[Ledebe note to the assistant:";
  const RETAIN_NOTE =
    RETAIN_MARKER + " sensitive values in this message have already been redacted"
    + " on-device and replaced with placeholder tokens like [LDB_EMAIL_1]. No real"
    + " personal data is present, so it is safe to proceed. Complete the user's"
    + " request normally and keep every [LDB_...] token exactly as written — do not"
    + " alter, remove, translate, expand, flag, or invent values for them.]";

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

  async function localGet(defaults) {
    try {
      return hasContext() ? await chrome.storage.local.get(defaults) : defaults;
    } catch (error) {
      return defaults;
    }
  }

  function mappingStore() {
    return settings.persistMappings ? chrome.storage?.local : chrome.storage?.session;
  }

  // The map is scoped to the current host, so protection on one site never bleeds
  // into another site or tab, and the panel only shows what concerns this page.
  function mappingKey() {
    return `${PLACEHOLDER_STORAGE_KEY}::${getHost()}`;
  }

  async function mappingGet() {
    try {
      const store = mappingStore();
      if (!hasContext() || !store) return {};
      const key = mappingKey();
      const data = await store.get(key);
      return data[key] || {};
    } catch (error) {
      return {};
    }
  }

  function mappingSet() {
    try {
      const store = mappingStore();
      if (hasContext() && store) {
        void store.set({ [mappingKey()]: Object.fromEntries(placeholderMap) });
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

  function normalizeTerms(terms) {
    const seen = new Set();
    return (terms || [])
      .map((term) => String(term || "").trim())
      .filter(Boolean)
      .filter((term) => {
        const key = term.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function feedbackCategoryForHost(host) {
    if (host?.includes("gemini")) return "gemini-extension";
    if (host?.includes("claude")) return "claude-extension";
    return "browser-extension";
  }

  async function getStoredSettings() {
    const synced = await syncGet(DEFAULTS);
    const personalTerms = normalizeTerms(
      synced.personalTerms && synced.personalTerms.length ? synced.personalTerms : synced.customTerms
    );
    return {
      ...synced,
      customTerms: personalTerms,
      personalTerms
    };
  }

  async function getCompanyState() {
    const result = await localGet({
      [COMPANY_STATE_STORAGE_KEY]: null,
      [COMPANY_TERMS_STORAGE_KEY]: []
    });
    return {
      companySync: result[COMPANY_STATE_STORAGE_KEY],
      companyTerms: normalizeTerms(result[COMPANY_TERMS_STORAGE_KEY] || [])
    };
  }

  function effectivePlanFromData(storedSettings, companySync) {
    return companySync?.companyId ? "team" : (storedSettings.subscriptionPlan || "free");
  }

  function personalLimitForPlan(plan) {
    return PERSONAL_TERM_LIMITS[plan] ?? PERSONAL_TERM_LIMITS.free;
  }

  function base64ToBuf(b64) {
    const str = atob(b64);
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1) buf[i] = str.charCodeAt(i);
    return buf.buffer;
  }

  async function importTeamKey(base64) {
    return crypto.subtle.importKey(
      "raw",
      base64ToBuf(base64),
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptTerms(encryptedTerms, termsIv, teamKey) {
    const iv = base64ToBuf(termsIv);
    const key = await importTeamKey(teamKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      base64ToBuf(encryptedTerms)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  async function decryptTeamKeyWithCode(encryptedTeamKey, salt64, iv64, joinCode) {
    const enc = new TextEncoder();
    const salt = base64ToBuf(salt64);
    const iv = base64ToBuf(iv64);
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(joinCode),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const codeKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      codeKey,
      base64ToBuf(encryptedTeamKey)
    );
    const bytes = new Uint8Array(decrypted);
    let str = "";
    for (const byte of bytes) str += String.fromCharCode(byte);
    return btoa(str);
  }

  async function refreshStateIfAvailable() {
    const local = await localGet({
      [COMPANY_TERMS_STORAGE_KEY]: [],
      [COMPANY_STATE_STORAGE_KEY]: null
    });
    settings.companyTerms = normalizeTerms(local[COMPANY_TERMS_STORAGE_KEY] || []);
    settings.companySync = local[COMPANY_STATE_STORAGE_KEY] || null;
    refreshDrawer(true);
  }

  async function syncCompanyTerms(force = false) {
    const { companySync } = await getCompanyState();
    if (!companySync?.companyId || !companySync.teamKey) {
      toast(t("settings.joinFirst", "Join a company first."));
      return null;
    }

    const response = await fetch(`${COMPANY_API_BASE}/terms/${companySync.companyId}`);
    if (!response.ok) throw new Error("Could not sync company words");
    const data = await response.json();
    if (!data.encryptedTerms) {
      await chrome.storage.local.set({ [COMPANY_TERMS_STORAGE_KEY]: [] });
      return [];
    }
    if (!force && data.termsVersion <= (companySync.termsVersion || 0)) {
      return null;
    }

    const terms = await decryptTerms(data.encryptedTerms, data.termsIv, companySync.teamKey);
    const nextCompanySync = {
      ...companySync,
      termsVersion: data.termsVersion,
      lastSyncAt: new Date().toISOString()
    };
    await chrome.storage.local.set({
      [COMPANY_TERMS_STORAGE_KEY]: normalizeTerms(terms.map((term) => term.text || term)),
      [COMPANY_STATE_STORAGE_KEY]: nextCompanySync
    });

    if (companySync.employeeEmail) {
      try {
        await fetch(`${COMPANY_API_BASE}/members/${companySync.companyId}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: companySync.employeeEmail })
        });
      } catch (error) {
        /* ignore heartbeat */
      }
    }

    await refreshStateIfAvailable();
    return terms;
  }

  async function joinCompany(joinCode, email) {
    const response = await fetch(`${COMPANY_API_BASE}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: joinCode.toUpperCase(), email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not join company");

    const teamKey = await decryptTeamKeyWithCode(
      data.encryptedTeamKey,
      data.teamKeySalt,
      data.teamKeyIv,
      joinCode.toUpperCase()
    );

    await chrome.storage.local.set({
      [COMPANY_STATE_STORAGE_KEY]: {
        companyId: data.companyId,
        companyName: data.companyName,
        employeeEmail: email,
        teamKey,
        termsVersion: 0,
        joinedAt: new Date().toISOString()
      }
    });

    await syncCompanyTerms(true);
  }

  async function leaveCompany() {
    await chrome.storage.local.remove([COMPANY_STATE_STORAGE_KEY, COMPANY_TERMS_STORAGE_KEY]);
    await refreshStateIfAvailable();
  }

  async function submitFeedback({ message, email, host, category }) {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "browser-extension",
        category,
        host: host || "unknown",
        email: email || "anonymous",
        message
      })
    });
    if (!response.ok) throw new Error("Could not send feedback");
  }

  function effectivePlan() {
    return settings.companySync?.companyId ? "team" : (settings.subscriptionPlan || "free");
  }

  function personalTermLimit() {
    return PERSONAL_TERM_LIMITS[effectivePlan()] ?? PERSONAL_TERM_LIMITS.free;
  }

  function allCustomTerms() {
    return normalizeTerms([
      ...(settings.companyTerms || []),
      ...(settings.personalTerms || [])
    ]);
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

  function getSelectedFieldText(element) {
    if (!element) return "";
    if (isPlainField(element)) {
      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? start;
      return end > start ? element.value.slice(start, end) : "";
    }
    const box = getComposer(element) || element;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return "";
    const range = sel.getRangeAt(0);
    if (!box.contains(range.commonAncestorContainer)) return "";
    return range.toString();
  }

  function setSelectedRange(element, start, end) {
    if (!element) return false;
    if (isPlainField(element)) {
      element.focus();
      element.selectionStart = start;
      element.selectionEnd = end;
      return true;
    }
    const box = getComposer(element) || element;
    if (!(box instanceof HTMLElement)) return false;
    box.focus();
    try {
      const sel = window.getSelection();
      const range = rangeFromOffsets(box, start, end);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set a plain field's value through the native setter so frameworks notice.
  function setPlainValue(element, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function replaceSelectedFieldText(element, nextValue, fallbackSelectedText = "", keepInsertedSelection = false) {
    if (isPlainField(element)) {
      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? start;
      if (end > start) {
        const current = element.value || "";
        setPlainValue(element, `${current.slice(0, start)}${nextValue}${current.slice(end)}`);
        const nextEnd = start + nextValue.length;
        if (keepInsertedSelection) {
          element.selectionStart = start;
          element.selectionEnd = nextEnd;
        } else {
          element.selectionStart = element.selectionEnd = nextEnd;
        }
        return true;
      }
      if (fallbackSelectedText) {
        const current = element.value || "";
        const index = current.indexOf(fallbackSelectedText);
        if (index >= 0) {
          setPlainValue(element, `${current.slice(0, index)}${nextValue}${current.slice(index + fallbackSelectedText.length)}`);
          const nextEnd = index + nextValue.length;
          if (keepInsertedSelection) {
            element.selectionStart = index;
            element.selectionEnd = nextEnd;
          } else {
            element.selectionStart = element.selectionEnd = nextEnd;
          }
          return true;
        }
      }
      return false;
    }

    const box = getComposer(element) || element;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!box.contains(range.commonAncestorContainer)) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    if (!document.execCommand("insertText", false, nextValue)) {
      range.deleteContents();
      range.insertNode(document.createTextNode(nextValue));
    }
    box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: nextValue }));
    return true;
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

  function focusReplacementSelection(element, replacement, selection = "") {
    if (!element || !replacement) return;
    const text = getFieldText(element);
    let start = text.indexOf(replacement);
    if (start < 0 && selection) {
      const alt = text.indexOf(selection);
      if (alt >= 0) start = alt;
    }
    if (start < 0) return;
    const end = start + replacement.length;
    void setSelectedRange(element, start, end);
    window.setTimeout(() => {
      void setSelectedRange(element, start, end);
    }, 0);
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
  // except the value the caret is still sitting in. Final protection still
  // happens on send, but the idle pass should not grab an email or token the
  // user is still finishing in place.
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
      customTerms: allCustomTerms(),
      exclude: unprotected,
      existingMap: placeholderMap,
      counters,
      namespace: placeholderNamespace(),
      disabledTypes: disabledTypes()
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
    const full = getComposerText(box);
    if (!full) return false;

    const caret = force ? null : getCaret(box);
    const result = computeLiveReplacement(full, caret, options);
    if (!result.changed) return false;

    selfEdit = true;
    try {
      applyFieldText(element, result.text, typeof result.caret === "number"
        ? { selectionStart: result.caret, selectionEnd: result.caret }
        : undefined);
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

  function placeholderTokensIn(text) {
    return [...new Set((String(text || "").match(/\[LDB_[A-Z0-9_]+\]/g) || []))];
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
    applyFieldText(element, masked, {
      selectionStart: masked.indexOf(token),
      selectionEnd: masked.indexOf(token) + token.length
    });
    afterProtect(element);
  }

  // Reveal a value: swap every token that maps to it back to the real text, in
  // the active field. Grouped by value, so one click reveals all its copies.
  function unprotectValue(value) {
    const element = activeEditable;
    if (!element) return;

    // Never write a real value into a surface the AI app syncs (Canvas, artifact,
    // message). The value stays visible in this panel only.
    if (isSyncedDocSurface(element)) {
      toast("Revealing here could send it to the AI. The real value stays in this panel only.");
      refreshDrawer();
      return;
    }

    let current = getFieldText(element);
    let changed = false;
    for (const [token, val] of placeholderMap.entries()) {
      if (val !== value || !current.includes(token)) continue;
      current = current.split(token).join(value);
      changed = true;
    }
    if (!changed) {
      refreshDrawer();
      return;
    }
    unprotected.add(value.toLowerCase()); // don't immediately re-mask it
    const start = current.indexOf(value);
    applyFieldText(element, current, start >= 0
      ? { selectionStart: start, selectionEnd: start + value.length }
      : undefined);
    afterProtect(element);
  }

  function toggleSelectionProtection(selectedText = "") {
    const element = activeEditable || resolveEditable(document.activeElement);
    if (!element) {
      toast("Click into a text field first.");
      return;
    }
    activeEditable = element;

    const selection = getSelectedFieldText(element) || selectedText;
    const tokens = placeholderTokensIn(selection);
    if (!tokens.length && selection) {
      const result = maskText(selection, allCustomTerms(), {
        namespace: placeholderNamespace(),
        exclude: unprotected,
        disabledTypes: disabledTypes()
      });
      if (!result.replacements.length) {
        toast("Nothing sensitive found in this selection.");
        return;
      }
      rememberReplacements(result.replacements);
      if (!replaceSelectedFieldText(element, result.masked, selection, true)) {
        refreshDrawer();
        return;
      }
      afterProtect(element);
      return;
    }
    if (!tokens.length) {
      protectActiveField();
      return;
    }

    if (isSyncedDocSurface(element)) {
      toast("Revealing here could send it to the AI. The real value stays in this panel only.");
      refreshDrawer();
      return;
    }

    let restored = selection;
    let changed = false;
    for (const token of tokens) {
      const value = placeholderMap.get(token);
      if (typeof value !== "string" || !restored.includes(token)) continue;
      restored = restored.split(token).join(value);
      unprotected.add(value.toLowerCase());
      changed = true;
    }
    if (!changed) {
      refreshDrawer();
      return;
    }

    if (!replaceSelectedFieldText(element, restored, selection, true)) {
      refreshDrawer();
      return;
    }
    focusReplacementSelection(element, restored, selection);
    afterProtect(element);
  }

  // Drop every mapping for a value from the session map. Stops it being restored
  // in future replies; does not touch the page.
  function forgetValue(value) {
    for (const [token, val] of [...placeholderMap.entries()]) {
      if (val === value) placeholderMap.delete(token);
    }
    unprotected.delete(value.toLowerCase());
    mappingSet();
    refreshDrawer();
  }

  // Whole-field write used by per-item toggles + manual protect. For rich
  // composers we select-all then insertText so the editor reconciles cleanly.
  function applyFieldText(element, value, selection = null) {
    selfEdit = true;
    try {
      if (isPlainField(element)) {
        setPlainValue(element, value);
        if (selection && typeof selection.selectionStart === "number" && typeof selection.selectionEnd === "number") {
          setSelectedRange(element, selection.selectionStart, selection.selectionEnd);
        }
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
        if (selection && typeof selection.selectionStart === "number" && typeof selection.selectionEnd === "number") {
          setSelectedRange(box, selection.selectionStart, selection.selectionEnd);
        }
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
    const result = maskText(original, allCustomTerms(), {
      namespace: placeholderNamespace(),
      exclude: unprotected,
      disabledTypes: disabledTypes()
    });
    if (!result.replacements.length) {
      toast("Nothing sensitive found in this field.");
      return;
    }
    rememberReplacements(result.replacements);
    applyFieldText(activeEditable, result.masked);
    afterProtect(activeEditable);
    toast(`Protected ${result.replacements.length} item${result.replacements.length === 1 ? "" : "s"}.`);
    showNotice();
  }

  // ---- detection, grouped by value with occurrence counts -----------------
  // Each value appears once; `count` is how many times it occurs, so the panel
  // shows "email ×3" instead of three identical rows.

  // Detected-but-still-plaintext PII in the field.
  function exposedItems(text) {
    if (!text) return [];
    const groups = new Map();
    for (const finding of detectPII(text, allCustomTerms(), disabledTypes())) {
      if (finding.value.startsWith("[LDB_")) continue;
      const key = finding.value.toLowerCase();
      const g = groups.get(key) || { value: finding.value, label: finding.label, count: 0 };
      g.count += 1;
      groups.set(key, g);
    }
    return [...groups.values()];
  }

  // Placeholders present in the field, grouped back to their real value.
  function protectedItems(text) {
    if (!text) return [];
    const groups = new Map();
    const regex = /\[LDB_[A-Z0-9_]+\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const value = placeholderMap.get(match[0]);
      if (typeof value !== "string") continue;
      const g = groups.get(value) || { value, count: 0 };
      g.count += 1;
      groups.set(value, g);
    }
    return [...groups.values()];
  }

  // Session mappings whose value isn't currently in the field, grouped by value.
  function sessionItems(fieldValues) {
    const groups = new Map();
    for (const value of placeholderMap.values()) {
      if (fieldValues.has(value)) continue;
      const g = groups.get(value) || { value, count: 0 };
      g.count += 1;
      groups.set(value, g);
    }
    return [...groups.values()];
  }

  // ---- slide-in side panel (drawer) ---------------------------------------

  let drawer = null;
  let drawerOpen = false;
  let drawerDismissed = false;
  let nativePanelOpen = false; // true while the native side panel is showing
  let latestRestoredText = "";
  let activeTab = "field"; // "home" | "words" | "field" | "settings"
  let renderedDrawerTab = null; // skip rebuilding words/settings on every poll
  let advancedOpen = false;     // overlay Settings → Advanced disclosure state
  let autoHideTimer = null;
  let drawerHovered = false;
  const AUTO_HIDE_MS = 5000;
  const PAGE_PUSH_CLASS = "ledebe-page-pushed";
  const PAGE_PUSH_VAR = "--ledebe-panel-offset";
  let notice = null;
  let noticeTimer = null;
  const NOTICE_HIDE_MS = 3000;

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
          <div class="ledebe-drawer__brand-copy">
            <div class="ledebe-drawer__title-row">
              <strong>Ledebe Protector</strong>
              <span class="ledebe-drawer__privacy-badge"></span>
            </div>
            <span class="ledebe-drawer__sub"></span>
          </div>
        </div>
        <button type="button" class="ledebe-drawer__close" aria-label="Close">×</button>
      </header>
      <nav class="ledebe-tabs">
        <button type="button" class="ledebe-tab" data-tab="home">${t("tabs.home", "Home")}</button>
        <button type="button" class="ledebe-tab" data-tab="words">${t("tabs.words", "Custom words")}</button>
        <button type="button" class="ledebe-tab" data-tab="field">${t("tabs.field", "Protected words")}</button>
        <button type="button" class="ledebe-tab" data-tab="settings">${t("tabs.settings", "Settings")}</button>
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
    // Pause the auto-hide while the user is interacting; resume on leave.
    drawer.addEventListener("mouseenter", () => {
      drawerHovered = true;
      if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
    });
    drawer.addEventListener("mouseleave", () => {
      drawerHovered = false;
      scheduleAutoHide();
    });

    document.documentElement.appendChild(drawer);
    return drawer;
  }

  function ensureNotice() {
    if (notice && document.documentElement.contains(notice)) return notice;
    notice = document.createElement("div");
    notice.className = "ledebe-notice";
    notice.innerHTML = `
      <div class="ledebe-notice__card" role="status" aria-live="polite">
        <span class="ledebe-notice__text">Protected. Click the icon if you want the full panel.</span>
        <button type="button" class="ledebe-notice__icon" aria-label="Open Ledebe conversation panel"></button>
      </div>
    `;
    const iconButton = notice.querySelector(".ledebe-notice__icon");
    const iconUrl = runtimeUrl("ledebe-icon.png");
    if (iconButton) {
      if (iconUrl) {
        iconButton.innerHTML = `<img src="${iconUrl}" alt="" />`;
      } else {
        iconButton.textContent = "L";
      }
      iconButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideNotice(true);
        await toggleOverlay();
      });
    }
    document.documentElement.appendChild(notice);
    return notice;
  }

  function hideNotice(immediate = false) {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    document.querySelectorAll(".ledebe-inline-btn, .ledebe-inline-tray").forEach((node) => {
      node.classList.remove("ledebe-guided-target");
    });
    if (!notice) return;
    if (immediate) {
      notice.classList.remove("is-visible");
      notice.remove();
      notice = null;
      return;
    }
    notice.classList.remove("is-visible");
    const current = notice;
    window.setTimeout(() => {
      if (notice === current && !current.classList.contains("is-visible")) {
        current.remove();
        notice = null;
      }
    }, 260);
  }

  function showNotice() {
    if (nativePanelOpen || drawerOpen) return;
    const el = ensureNotice();
    document.querySelectorAll(".ledebe-inline-btn").forEach((button) => {
      button.classList.add("ledebe-guided-target");
      button.parentElement?.classList.add("ledebe-inline-tray");
      button.parentElement?.classList.add("ledebe-guided-target");
    });
    if (noticeTimer) clearTimeout(noticeTimer);
    void el.offsetWidth;
    el.classList.add("is-visible");
    noticeTimer = window.setTimeout(() => {
      noticeTimer = null;
      hideNotice();
    }, NOTICE_HIDE_MS);
  }

  function setActiveTab(tab) {
    activeTab = tab;
    refreshDrawer(true);
  }

  // Open overlays stay visible for a moment after the last activity unless hovered.
  // Don't auto-hide on Custom words / Settings — the user navigated there on
  // purpose and may be reading or editing.
  function scheduleAutoHide() {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    if (activeTab === "words" || activeTab === "settings") return;
    autoHideTimer = window.setTimeout(() => {
      autoHideTimer = null;
      if (drawerOpen && !drawerHovered) closeDrawer();
    }, AUTO_HIDE_MS);
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

  // Per-message copy button, like the one on ChatGPT's reply blocks.
  function msgCopyButton(text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ledebe-msg__copy";
    btn.title = t("common.copy", "Copy");
    btn.textContent = t("common.copy", "Copy");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = t("common.copied", "Copied");
        setTimeout(() => { btn.textContent = t("common.copy", "Copy"); }, 1200);
      } catch (error) {
        /* clipboard blocked */
      }
    });
    return btn;
  }

  // ---- Home tab: the chat, mirrored with real values restored -------------

  function stripRetainNote(text) {
    // Hide our injected on-send note from the mirror (it sits at the top).
    let out = text.split(RETAIN_NOTE).join("");
    const start = out.indexOf(RETAIN_MARKER);
    if (start !== -1) {
      const end = out.indexOf("for them.]", start);
      if (end !== -1) out = out.slice(0, start) + out.slice(end + "for them.]".length);
    }
    return out.trim();
  }

  function restoredText(raw) {
    return stripRetainNote(restorePlaceholders((raw || "").trim(), placeholderMap).restored);
  }

  function readStructuredText(node) {
    if (!(node instanceof HTMLElement)) return "";
    const clone = node.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return node.innerText || node.textContent || "";
    clone.querySelectorAll(
      'button, svg, img, summary, [aria-hidden="true"], [contenteditable="false"], '
      + '[role="button"], [data-testid*="copy"], .ledebe-inline-btn'
    ).forEach((n) => n.remove());
    clone.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
    clone.querySelectorAll("li").forEach((n) => {
      if (!n.textContent?.trim().startsWith("- ")) {
        n.prepend("- ");
      }
      if (!n.textContent?.endsWith("\n")) n.append("\n");
    });
    clone.querySelectorAll("p, div, h1, h2, h3, h4, h5, h6, blockquote, section, article, ul, ol").forEach((n) => {
      if (!n.textContent?.endsWith("\n")) n.append("\n");
    });
    return (clone.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function findStructuredCopyBlock(node) {
    if (!(node instanceof HTMLElement)) return null;
    if (node.matches("pre")) return node;
    if (node.matches('[data-writing-block-fullscreen-editor-region="true"]')) return node;
    return node.querySelector?.('[data-writing-block-fullscreen-editor-region="true"]') || null;
  }

  // Split a turn into blocks in document order: prose, plus each code block
  // (e.g. ChatGPT's fenced "Email" block) as its own segment with its own Copy.
  // We read innerText from the LIVE, in-document nodes — innerText only honours
  // line breaks for rendered elements, so a detached clone would flatten the
  // reply into one wall of text and lose the headings/bullets/blank lines.
  function restoredBlocksFor(el) {
    const root = el.querySelector(".markdown, .prose") || el;
    const children = root.children.length ? Array.from(root.children) : [el];
    const blocks = [];
    let prose = [];
    const flush = () => {
      const text = restoredText(prose.join("\n\n"));
      if (text) blocks.push({ kind: "text", text });
      prose = [];
    };

    for (const child of children) {
      if (child.classList && child.classList.contains("ledebe-inline-btn")) continue;
      const structuredBlock = findStructuredCopyBlock(child);
      if (structuredBlock) {
        flush();
        const codeEl = structuredBlock.querySelector?.("code") || structuredBlock; // skip the lang/copy header
        const code = restoredText(readStructuredText(codeEl));
        if (code) blocks.push({ kind: "code", text: code });
      } else {
        const part = readStructuredText(child);
        if (part.trim()) prose.push(part);
      }
    }
    flush();

    if (!blocks.length) {
      const all = restoredText(readStructuredText(el));
      if (all) blocks.push({ kind: "text", text: all });
    }
    return blocks;
  }

  function fieldActionsEl() {
    const wrap = document.createElement("div");
    wrap.className = "ledebe-drawer__actions";
    wrap.append(
      drawerButton(t("field.toggleSelection", "Toggle selected text"), "secondary", () => toggleSelectionProtection()),
      drawerButton(t("settings.protectField", "Protect active field now"), "primary", () => protectActiveField())
    );
    return wrap;
  }

  // Mirror the conversation, restored, across the major assistants. Returns
  // turns ({ role, blocks }) in document order; empty when the page markup isn't
  // recognised (the Home tab then falls back to the latest restored reply).
  function collectRestoredTranscript() {
    const providers = [
      {
        sel: "[data-message-author-role], [data-message-author]",
        role: (el) => el.getAttribute("data-message-author-role") || el.getAttribute("data-message-author") || "user"
      },
      {
        sel: '[data-testid="user-message"], [data-testid="assistant-message"], [data-testid="conversation-turn-user"], [data-testid="conversation-turn-assistant"], .font-user-message, .font-claude-message, [data-message-role="user"], [data-message-role="assistant"]',
        role: (el) => {
          if (
            el.matches('[data-testid="user-message"], [data-testid="conversation-turn-user"], .font-user-message, [data-message-role="user"]')
          ) return "user";
          return "assistant";
        }
      },
      {
        sel: "user-query, model-response, [data-test-id='message-user'], [data-test-id='message-assistant'], [data-message-type='user'], [data-message-type='model']",
        role: (el) => {
          const tag = el.tagName.toLowerCase();
          const type = el.getAttribute("data-message-type");
          return tag === "user-query" || el.getAttribute("data-test-id") === "message-user" || type === "user"
            ? "user"
            : "assistant";
        }
      }
    ];

    for (const provider of providers) {
      const nodes = document.querySelectorAll(provider.sel);
      if (!nodes.length) continue;
      const turns = [];
      for (const el of nodes) {
        if (isInsideLedebeUi(el)) continue;
        const parentTurn = el.parentElement?.closest(provider.sel);
        if (parentTurn) continue;
        if (!(el.innerText || el.textContent || "").trim()) continue;
        const blocks = restoredBlocksFor(el);
        if (blocks.length) turns.push({ role: provider.role(el), blocks });
      }
      if (turns.length) return turns;
    }
    return [];
  }

  function renderHomePane(body) {
    body.appendChild(leadEl(t("home.lead", "Your chat with real values restored — shown only here. The page itself keeps the placeholders.")));

    const turns = collectRestoredTranscript();
    if (!turns.length) {
      if (latestRestoredText) {
        const pre = document.createElement("pre");
        pre.className = "ledebe-drawer__restored";
        pre.textContent = latestRestoredText;
        body.appendChild(pre);
        body.appendChild(copyButton(t("home.copyReply", "Copy restored reply"), () => latestRestoredText));
      } else {
        body.appendChild(emptyEl(t("home.noReply", "No restored content yet. Send a protected prompt and the chat will mirror here with your real values.")));
      }
      return;
    }

    for (const turn of turns) {
      const msg = document.createElement("div");
      msg.className = `ledebe-msg ledebe-msg--${turn.role === "assistant" ? "assistant" : "user"}`;
      const who = document.createElement("div");
      who.className = "ledebe-msg__role";
      who.textContent = turn.role === "assistant" ? t("home.assistant", "Assistant") : t("home.you", "You");
      msg.append(who);

      for (const block of turn.blocks) {
        const blk = document.createElement("div");
        blk.className = "ledebe-msg__block" + (block.kind === "code" ? " is-code" : "");
        const bhead = document.createElement("div");
        bhead.className = "ledebe-msg__bhead";
        bhead.appendChild(msgCopyButton(block.text)); // copies just this block
        const text = document.createElement("div");
        text.className = "ledebe-msg__text";
        text.textContent = block.text;
        blk.append(bhead, text);
        msg.appendChild(blk);
      }
      body.appendChild(msg);
    }

    body.appendChild(copyButton(t("home.copyTranscript", "Copy whole transcript"), () =>
      turns.map((turn) => `${turn.role === "assistant" ? t("home.assistant", "Assistant") : t("home.you", "You")}:\n${turn.blocks.map((b) => b.text).join("\n\n")}`).join("\n\n")));
  }

  // ---- Custom words tab ----------------------------------------------------

  function addCustomTerm(term) {
    const terms = [...(settings.personalTerms || [])];
    const normalized = String(term || "").trim();
    if (!normalized || allCustomTerms().some((t) => t.toLowerCase() === normalized.toLowerCase())) {
      return { ok: false, reason: "duplicate" };
    }
    if (terms.length >= personalTermLimit()) {
      return { ok: false, reason: "limit" };
    }
    terms.push(normalized);
    settings.personalTerms = normalizeTerms(terms);
    settings.customTerms = settings.personalTerms;
    unprotected.delete(normalized.toLowerCase());
    void syncSet({ personalTerms: settings.personalTerms, customTerms: settings.personalTerms });
    if (activeEditable) liveReplace(activeEditable, true); // protect it right away
    refreshDrawer(true);
    return { ok: true };
  }

  function removeCustomTerm(term) {
    settings.personalTerms = (settings.personalTerms || []).filter((t) => t.toLowerCase() !== term.toLowerCase());
    settings.customTerms = settings.personalTerms;
    void syncSet({ personalTerms: settings.personalTerms, customTerms: settings.personalTerms });
    refreshDrawer(true);
  }

  function renderWordsPane(body) {
    const plan = effectivePlan();
    const limit = personalTermLimit();
    const personalTerms = settings.personalTerms || [];
    const companyTerms = settings.companyTerms || [];
    const limitLabel = Number.isFinite(limit) ? `${personalTerms.length}/${limit} personal words` : `${personalTerms.length} personal words`;
    body.appendChild(leadEl(`${t("words.lead", "Always protect these words — names, project codes, client terms. Company-managed words apply automatically, and your own personal words are added on top.")} Plan: ${plan}. ${limitLabel}.`));

    const add = document.createElement("div");
    add.className = "ledebe-words__add";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "ledebe-words__input";
    input.placeholder = t("words.placeholder", "Add a word or phrase…");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ledebe-words__btn";
    btn.textContent = t("words.add", "Add");
    const submit = () => {
      const value = input.value.trim();
      if (!value) return;
      const result = addCustomTerm(value);
      if (result?.ok) {
        input.value = "";
      } else if (result?.reason === "limit") {
        toast(t("words.limitWarn", "Your {plan} plan allows {limit} personal custom words.", { plan, limit }));
      } else if (result?.reason === "duplicate") {
        toast(t("words.duplicateWarn", "That word is already protected."));
      }
    };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    add.append(input, btn);
    body.appendChild(add);

    if (!companyTerms.length && !personalTerms.length) {
      body.appendChild(emptyEl(t("words.none", "No custom words yet.")));
      return;
    }
    if (companyTerms.length) {
      body.appendChild(sectionEl(t("words.companySection", "Company words ({count})", { count: companyTerms.length })));
      for (const term of companyTerms) {
        body.appendChild(rowEl("protected", term, t("words.companyManaged", "company-managed"), t("words.locked", "Locked"), () => {}));
      }
    }
    body.appendChild(sectionEl(t("words.personalSection", "Personal words ({count})", { count: personalTerms.length })));
    for (const term of personalTerms) {
      body.appendChild(rowEl("protected", term, t("words.customWord", "custom word"), t("common.remove", "Remove"), () => removeCustomTerm(term)));
    }
  }

  // ---- This-field tab: live protected / exposed list -----------------------

  function timesLabel(count) {
    return count > 1 ? `${count}×` : "";
  }

  function renderFieldPane(body) {
    const text = getFieldText(activeEditable);
    const prot = protectedItems(text);
    const exposed = exposedItems(text);
    const fieldValues = new Set(prot.map((item) => item.value));
    const session = sessionItems(fieldValues);

    body.appendChild(fieldActionsEl());

    if (exposed.length) {
      body.appendChild(sectionEl(`Exposed (${exposed.length})`));
      for (const item of exposed) {
        const meta = [item.label, timesLabel(item.count)].filter(Boolean).join(" · ");
        body.appendChild(rowEl("exposed", item.value, meta, "Protect", () => protectValue(item.value)));
      }
    }

    if (prot.length) {
      body.appendChild(sectionEl(`Protected (${prot.length})`));
      for (const item of prot) {
        const meta = item.count > 1 ? `protected · ${item.count}×` : "protected";
        body.appendChild(rowEl("protected", item.value, meta, "Unprotect", () => unprotectValue(item.value)));
      }
    }

    if (session.length) {
      body.appendChild(sectionEl(`Protected this session (${session.length})`));
      for (const item of session) {
        const meta = item.count > 1 ? `${item.count} placeholders` : "1 placeholder";
        body.appendChild(rowEl("protected", item.value, meta, "Forget", () => forgetValue(item.value)));
      }
    }

    if (!prot.length && !exposed.length && !session.length) {
      body.appendChild(emptyEl(t("field.none", "No sensitive data detected in this field.")));
    }
  }

  // ---- Settings tab (mirrors the native side panel) ------------------------

  function settingsToggle(key, label, hint, checked) {
    const wrap = document.createElement("label");
    wrap.className = "ledebe-toggle";
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = label;
    const small = document.createElement("small");
    small.textContent = hint;
    span.append(strong, small);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", async () => {
      settings[key] = input.checked;
      await syncSet({ [key]: input.checked });
      if (activeEditable && settings.autoReplace) liveReplace(activeEditable, true);
      refreshDrawer(true);
    });
    wrap.append(span, input);
    return wrap;
  }

  function drawerButton(label, kind, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ledebe-drawer__btn ledebe-drawer__btn--${kind}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function drawerCard() {
    const card = document.createElement("div");
    card.className = "ledebe-drawer__card";
    return card;
  }

  function drawerStack(className = "") {
    const stack = document.createElement("div");
    stack.className = `ledebe-drawer__stack${className ? ` ${className}` : ""}`;
    return stack;
  }

  async function pauseSite() {
    const host = getHost();
    const paused = new Set(settings.pausedHosts || []);
    if (paused.has(host)) paused.delete(host); else paused.add(host);
    settings.pausedHosts = Array.from(paused);
    await syncSet({ pausedHosts: settings.pausedHosts });
    refreshDrawer(true);
  }

  async function clearSavedData(btn) {
    const key = mappingKey(); // only this site's protected data
    try { await chrome.storage.local.remove(key); } catch (e) { /* ignore */ }
    try { await chrome.storage.session.remove([key, LATEST_RESTORED_KEY]); } catch (e) { /* ignore */ }
    placeholderMap.clear();
    unprotected.clear();
    if (drawerOpen) refreshDrawer(true);
    if (btn) { btn.textContent = t("settings.cleared", "Cleared"); setTimeout(() => { btn.textContent = t("settings.clear", "Clear saved data"); }, 1200); }
  }

  async function renderSettingsPane(body) {
    const storedSettings = await getStoredSettings();
    const { companySync, companyTerms } = await getCompanyState();
    const host = getHost();
    const status = document.createElement("div");
    status.className = "ledebe-status-line";
    const a = document.createElement("span");
    a.textContent = t("settings.currentSite", "Current site");
    const b = document.createElement("strong");
    b.textContent = host || "—";
    status.append(a, b);
    body.appendChild(status);

    const planLine = document.createElement("div");
    planLine.className = "ledebe-status-line";
    const plan = effectivePlanFromData(storedSettings, companySync);
    const limit = personalLimitForPlan(plan);
    const planLabel = document.createElement("span");
    planLabel.textContent = t("settings.subscription", "Subscription");
    const planValue = document.createElement("strong");
    planValue.textContent = Number.isFinite(limit)
      ? `${plan} · ${storedSettings.personalTerms.length}/${limit} personal words`
      : `${plan} · unlimited personal words`;
    planLine.append(planLabel, planValue);
    body.appendChild(planLine);

    const companyCard = drawerCard();
    companyCard.appendChild(sectionEl(t("settings.companySync", "Company sync")));
    if (companySync?.companyId) {
      companyCard.appendChild(leadEl(t("settings.companyActive", "{company} is active. {count} company-managed words are applied automatically.", { company: companySync.companyName, count: companyTerms.length })));
      const joinedMeta = document.createElement("div");
      joinedMeta.className = "ledebe-status-line";
      const joinedLabel = document.createElement("span");
      joinedLabel.textContent = t("settings.joinedAs", "Joined as");
      const joinedValue = document.createElement("strong");
      joinedValue.textContent = companySync.employeeEmail || "—";
      joinedMeta.append(joinedLabel, joinedValue);
      companyCard.appendChild(joinedMeta);
      if (companySync.lastSyncAt) {
        const syncedMeta = document.createElement("div");
        syncedMeta.className = "ledebe-status-line";
        const syncedLabel = document.createElement("span");
        syncedLabel.textContent = t("settings.lastSync", "Last sync");
        const syncedValue = document.createElement("strong");
        syncedValue.textContent = new Date(companySync.lastSyncAt).toLocaleString();
        syncedMeta.append(syncedLabel, syncedValue);
        companyCard.appendChild(syncedMeta);
      }

      companyCard.appendChild(drawerButton(t("settings.syncNow", "Sync company words now"), "primary", async () => {
        try {
          await syncCompanyTerms(true);
          toast(t("settings.syncDone", "Company words synced."));
          refreshDrawer(true);
        } catch (error) {
          toast(error instanceof Error ? error.message : "Sync failed");
        }
      }));

      companyCard.appendChild(drawerButton(t("settings.leaveCompany", "Leave company sync"), "secondary", async () => {
        await leaveCompany();
        toast(t("settings.left", "Company sync removed from this browser."));
        refreshDrawer(true);
      }));
    } else {
      companyCard.appendChild(leadEl(t("settings.joinPrompt", "Join your company to receive admin-managed protected words. Your personal custom words still stay private to you and can be added separately.")));
      const joinCode = document.createElement("input");
      joinCode.type = "text";
      joinCode.className = "ledebe-words__input";
      joinCode.placeholder = t("settings.joinCode", "Company join code");
      const email = document.createElement("input");
      email.type = "email";
      email.className = "ledebe-words__input";
      email.placeholder = t("settings.workEmail", "Work email");
      companyCard.append(joinCode, email);
      companyCard.appendChild(drawerButton(t("settings.joinCompany", "Join company"), "primary", async () => {
        const code = joinCode.value.trim();
        const emailValue = email.value.trim();
        if (!code || !emailValue) {
          toast(t("settings.joinMissing", "Enter your join code and work email."));
          return;
        }
        try {
          await joinCompany(code, emailValue);
          toast(t("settings.joined", "Company sync is active."));
          refreshDrawer(true);
        } catch (error) {
          toast(error instanceof Error ? error.message : "Join failed");
        }
      }));
    }
    body.appendChild(companyCard);

    const feedbackCard = drawerCard();
    feedbackCard.appendChild(sectionEl(t("settings.feedback", "Feedback")));
    feedbackCard.appendChild(leadEl(t("settings.feedbackLead", "Tell us what worked or what broke. Please do not paste sensitive data.")));
    const feedbackMessage = document.createElement("textarea");
    feedbackMessage.className = "ledebe-words__input ledebe-drawer__textarea";
    feedbackMessage.rows = 4;
    feedbackMessage.placeholder = host && /claude|gemini/.test(host)
      ? t("settings.feedbackPlaceholderHost", "Describe what happened on {host}...", { host })
      : t("settings.feedbackPlaceholder", "Describe what happened...");
    const feedbackEmail = document.createElement("input");
    feedbackEmail.type = "email";
    feedbackEmail.className = "ledebe-words__input";
    feedbackEmail.placeholder = t("settings.feedbackEmail", "Email (optional)");
    const feedbackRow = drawerStack("ledebe-drawer__stack--actions");
    feedbackRow.append(
      drawerButton(t("settings.feedbackGood", "Works well"), "secondary", () => {
        feedbackMessage.value = host
          ? t("settings.feedbackGoodFillHost", "Ledebe worked well on {host}.", { host })
          : t("settings.feedbackGoodFill", "Ledebe worked well for me.");
      }),
      drawerButton(
        host?.includes("gemini")
          ? t("settings.feedbackGemini", "Report Gemini issue")
          : host?.includes("claude")
            ? t("settings.feedbackClaude", "Report Claude issue")
            : t("settings.feedbackIssue", "Report issue"),
        "secondary",
        () => {
          feedbackMessage.value = host
            ? t("settings.feedbackIssueFillHost", "I hit a problem on {host}: ", { host })
            : t("settings.feedbackIssueFill", "I hit a problem: ");
          feedbackMessage.focus();
        }
      )
    );
    feedbackCard.append(feedbackMessage, feedbackEmail, feedbackRow);
    feedbackCard.appendChild(drawerButton(t("settings.feedbackSend", "Send feedback"), "primary", async () => {
      const message = feedbackMessage.value.trim();
      if (!message) {
        toast(t("settings.feedbackMissing", "Enter a short message first."));
        return;
      }
      try {
        await submitFeedback({
          message,
          email: feedbackEmail.value.trim(),
          host,
          category: feedbackCategoryForHost(host)
        });
        feedbackMessage.value = "";
        feedbackEmail.value = "";
        toast(t("settings.feedbackSent", "Feedback sent. Thank you."));
      } catch (error) {
        toast(error instanceof Error ? error.message : t("settings.feedbackFailed", "Could not send feedback"));
      }
    }));
    body.appendChild(feedbackCard);

    body.appendChild(settingsToggle("enabled", t("settings.protectionOn", "Protection on"), t("settings.protectionHint", "Master switch for detection and masking."), settings.enabled !== false));
    body.appendChild(settingsToggle("autoReplace", t("settings.replace", "Replace as I type"), t("settings.replaceHint", "Mask each value live, before send."), settings.autoReplace !== false));
    body.appendChild(settingsToggle("restoreResponses", t("settings.restore", "Reveal replies here"), t("settings.restoreHint", "Show the reply with real values in this panel."), settings.restoreResponses !== false));

    body.appendChild(drawerButton(t("settings.protectField", "Protect active field now"), "primary", () => protectActiveField()));
    body.appendChild(drawerButton(t("field.toggleSelection", "Toggle selected text"), "secondary", () => toggleSelectionProtection()));
    const paused = (storedSettings.pausedHosts || []).includes(host);
    body.appendChild(drawerButton(paused ? t("settings.resume", "Resume on this site") : t("settings.pause", "Pause on this site"), "secondary", pauseSite));

    const adv = document.createElement("details");
    adv.className = "ledebe-advanced";
    adv.open = advancedOpen;
    adv.addEventListener("toggle", () => { advancedOpen = adv.open; });
    const summary = document.createElement("summary");
    summary.textContent = t("settings.advanced", "Advanced settings");
    adv.appendChild(summary);

    adv.appendChild(settingsToggle("scanOnPaste", t("settings.scanPaste", "Scan on paste"), t("settings.scanPasteHint", "Mask sensitive data you paste in."), settings.scanOnPaste !== false));
    adv.appendChild(settingsToggle("appendInstruction", t("settings.keepTokens", "Ask AI to keep placeholders"), t("settings.keepTokensHint", "Append a note on send so tokens stay intact."), settings.appendInstruction !== false));
    adv.appendChild(settingsToggle("persistMappings", t("settings.remember", "Remember across restarts"), t("settings.rememberHint", "Keep restoring older chats after the browser closes. Stays on this device."), settings.persistMappings !== false));

    adv.appendChild(sectionEl(t("settings.whatDetect", "What to detect")));
    adv.appendChild(settingsToggle("detectNames", t("settings.names", "Names"), t("settings.namesHint", "Two-or-more capitalised words (heuristic)."), settings.detectNames !== false));
    adv.appendChild(settingsToggle("detectNumbers", t("settings.numbers", "Numbers"), t("settings.numbersHint", "Any run of 3+ digits."), settings.detectNumbers !== false));
    adv.appendChild(settingsToggle("detectAddresses", t("settings.addresses", "Addresses"), t("settings.addressesHint", "Street addresses."), settings.detectAddresses !== false));
    adv.appendChild(settingsToggle("detectCodes", t("settings.codes", "Codes / IDs"), t("settings.codesHint", "Tokens mixing letters and digits."), settings.detectCodes !== false));
    adv.appendChild(leadEl(t("settings.alwaysDetected", "Emails, phone numbers, cards, SSNs, IPs and API keys are always detected.")));
    const clearBtn = drawerButton(t("settings.clear", "Clear saved data"), "secondary", () => clearSavedData(clearBtn));
    adv.appendChild(clearBtn);

    body.appendChild(adv);
  }

  function refreshDrawer(force = false) {
    if (!drawerOpen || !drawer) return;
    drawer.querySelector(".ledebe-drawer__sub").textContent =
      `${placeholderMap.size} value${placeholderMap.size === 1 ? "" : "s"} protected this session`;
    const privacyBadge = drawer.querySelector(".ledebe-drawer__privacy-badge");
    if (privacyBadge) privacyBadge.textContent = t("panel.privacy", "Your data never leaves your device.");
    drawer.querySelectorAll(".ledebe-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === activeTab));

    // Home / Protected words are live (rebuilt on each poll). Custom words and
    // Settings hold inputs/disclosures, so only rebuild them on tab switch or an
    // explicit action — otherwise typing/toggling would be wiped.
    const live = activeTab === "home" || activeTab === "field";
    if (live || force || renderedDrawerTab !== activeTab) {
      renderedDrawerTab = activeTab;
      const body = drawer.querySelector(".ledebe-drawer__body");
      body.innerHTML = "";
      if (activeTab === "home") renderHomePane(body);
      else if (activeTab === "words") renderWordsPane(body);
      else if (activeTab === "settings") renderSettingsPane(body);
      else renderFieldPane(body);
    }
    if (drawerOpen && !drawerHovered) scheduleAutoHide();
  }

  // Shift the page over so the docked panel doesn't cover the chat.
  function applyPagePush(width) {
    const html = document.documentElement;
    const body = document.body;
    const offset = width ? `${width}px` : "";
    const transition = "margin-right 0.26s cubic-bezier(0.22, 1, 0.36, 1), width 0.26s cubic-bezier(0.22, 1, 0.36, 1), max-width 0.26s cubic-bezier(0.22, 1, 0.36, 1)";
    html.style.setProperty(PAGE_PUSH_VAR, offset || "0px");
    html.style.transition = transition;
    html.style.marginRight = offset || "0px";
    html.classList.toggle(PAGE_PUSH_CLASS, Boolean(width));
    if (!body) return;
    body.style.transition = transition;
    body.style.marginRight = offset || "0px";
    body.style.width = offset ? `calc(100vw - ${offset})` : "";
    body.style.maxWidth = offset ? `calc(100vw - ${offset})` : "";
    body.style.overflowX = offset ? "clip" : "";
  }

  function openDrawer() {
    const el = ensureDrawer();
    hideNotice(true);
    drawerOpen = true;
    refreshDrawer();
    // Commit the off-screen start state (translateX) before flipping to open, so
    // the slide actually animates. A single requestAnimationFrame on a freshly
    // inserted node can be collapsed by the browser, skipping the transition.
    void el.offsetWidth;
    el.classList.add("is-open");
    const drawerWidth = el.offsetWidth || el.getBoundingClientRect().width || 360;
    applyPagePush(drawerWidth);
    scheduleAutoHide();
  }

  function closeDrawer() {
    drawerOpen = false;
    if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
    if (drawer) drawer.classList.remove("is-open");
    applyPagePush(0);
  }

  function maybeOpenDrawer() {
    if (nativePanelOpen) {
      // The native side panel is showing the same thing — don't double up.
      if (drawerOpen) closeDrawer();
      hideNotice(true);
      return;
    }
    if (!protectionActive() || !isAiHost() || drawerDismissed) {
      if (drawerOpen) refreshDrawer();
      hideNotice(true);
      return;
    }
    const text = getFieldText(activeEditable);
    if (protectedItems(text).length || exposedItems(text).length) {
      if (drawerOpen) {
        refreshDrawer();
      } else {
        activeTab = "field";
        showNotice();
      }
    } else {
      if (drawerOpen) refreshDrawer();
      hideNotice(true);
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
    + '[data-testid="assistant-message"], [data-testid="conversation-turn-assistant"], '
    + '[data-test-id="message-assistant"], [data-message-role="assistant"], [data-message-type="model"], '
    + '.model-response-text, message-content, model-response, [data-testid="model-response"], '
    + 'div.agent-turn, .font-claude-message, .markdown.prose';
  const TURN_MARKERS =
    '[data-message-author-role], [data-message-author], [data-testid="assistant-message"], [data-testid="user-message"], '
    + '[data-testid="conversation-turn-assistant"], [data-testid="conversation-turn-user"], '
    + '[data-test-id="message-assistant"], [data-test-id="message-user"], '
    + '[data-message-role], [data-message-type], message-content, model-response, .model-response-text';
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
      showNotice();
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
    scheduleInlineInjection(); // keep our per-message button present as turns render
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

  // Resolve the real editable from an event. Some AI apps (e.g. Gemini) wrap the
  // composer in a custom element, so event.target can be retargeted away from the
  // editable — walk the composed path (which pierces shadow boundaries) and fall
  // back to the focused element.
  function eventEditable(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    for (const node of path) {
      if (node instanceof HTMLElement) {
        const editable = resolveEditable(node);
        if (editable) return editable;
      }
    }
    return resolveEditable(event.target) || resolveEditable(document.activeElement);
  }

  function eventComposedTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    return (path[0] instanceof HTMLElement ? path[0] : null) || event.target;
  }

  function trackTarget(event) {
    const target = eventEditable(event);
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
    if (!settings.scanOnPaste) return;
    const target = trackTarget(event) || eventEditable(event) || activeEditable;
    if (!target) return;
    activeEditable = target;
    // After the pasted text lands, force-protect it directly. We don't gate this
    // on selfEdit or the caret guard, so every paste (not just the first) masks.
    window.setTimeout(() => {
      try { liveReplace(target, true); } catch (error) { console.debug("[Ledebe]", error); }
      maybeOpenDrawer();
    }, 60);
  }

  // Right before send (Enter / send button), force-mask anything still exposed.
  function flushBeforeSend() {
    const target = activeEditable || resolveEditable(document.activeElement);
    if (!target) return;
    activeEditable = target;
    liveReplace(target, true);
    addRetainInstruction(target);
  }

  // Prepend the "keep the placeholders" note to the prompt, once, and only when
  // the prompt actually contains placeholders. Goes into the composer text so it
  // is sent to the AI at the top of the masked prompt.
  function addRetainInstruction(element) {
    if (settings.appendInstruction === false || !element) return; // default on
    if (!isPlainField(element) && !element.isContentEditable && !getComposer(element)) return;
    const text = getFieldText(element);
    if (!text.includes("[LDB_") || text.includes(RETAIN_MARKER)) return;

    const note = RETAIN_NOTE + "\n\n";
    selfEdit = true;
    try {
      if (isPlainField(element)) {
        const pos = element.selectionStart ?? element.value.length;
        setPlainValue(element, note + text);
        const shifted = pos + note.length; // keep the caret where the user was
        element.selectionStart = element.selectionEnd = shifted;
      } else {
        const box = getComposer(element) || element;
        const prevCaret = getCaret(box); // user's caret before we prepend
        box.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(box);
        range.collapse(true); // caret to the START — note goes on top
        sel.removeAllRanges();
        sel.addRange(range);
        if (!document.execCommand("insertText", false, note)) {
          box.textContent = note + text;
        }
        box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: note }));
        if (typeof prevCaret === "number") setCaret(box, prevCaret + note.length);
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
    if (isAiHost() && isSendTrigger(eventComposedTarget(event))) flushBeforeSend();
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
    const synced = { ...DEFAULTS, ...(await syncGet(DEFAULTS)) };
    const local = await localGet({
      [COMPANY_TERMS_STORAGE_KEY]: [],
      [COMPANY_STATE_STORAGE_KEY]: null
    });
    const personalTerms = normalizeTerms(
      synced.personalTerms && synced.personalTerms.length
        ? synced.personalTerms
        : synced.customTerms
    );
    settings = {
      ...synced,
      customTerms: personalTerms,
      personalTerms,
      companyTerms: normalizeTerms(local[COMPANY_TERMS_STORAGE_KEY] || []),
      companySync: local[COMPANY_STATE_STORAGE_KEY] || null
    };
  }

  // ---- state + actions shared with the native side panel ------------------

  // A full snapshot of what both panels render, computed on demand so the native
  // side panel can poll the active tab without us writing to storage per key.
  function buildPageState() {
    const text = getFieldText(activeEditable);
    const prot = protectedItems(text);
    const fieldValues = new Set(prot.map((p) => p.value));
    return {
      host: getHost(),
      paused: isPaused(),
      enabled: settings.enabled,
      sessionCount: placeholderMap.size,
      exposed: exposedItems(text),
      protected: prot,
      session: sessionItems(fieldValues),
      transcript: settings.restoreResponses ? collectRestoredTranscript() : [],
      latestRestored: settings.restoreResponses ? latestRestoredText : "",
      customTerms: settings.personalTerms || [],
      personalTerms: settings.personalTerms || [],
      companyTerms: settings.companyTerms || [],
      personalTermLimit: personalTermLimit(),
      effectivePlan: effectivePlan(),
      companySync: settings.companySync || null
    };
  }

  async function requestNativeSidePanelToggle() {
    if (!hasContext() || typeof chrome.runtime?.sendMessage !== "function") return false;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(Boolean(ok));
      };
      const timer = window.setTimeout(() => finish(false), 180);
      try {
        chrome.runtime.sendMessage({ type: "TOGGLE_SIDE_PANEL" }, (response) => {
          window.clearTimeout(timer);
          try {
            if (chrome.runtime?.lastError) {
              finish(false);
              return;
            }
          } catch (error) {
            /* ignore */
          }
          finish(response?.ok);
        });
      } catch (error) {
        window.clearTimeout(timer);
        finish(false);
      }
    });
  }

  async function toggleOverlay() {
    if (nativePanelOpen) {
      const nativeToggled = await requestNativeSidePanelToggle();
      if (nativeToggled) {
        nativePanelOpen = false;
        if (drawerOpen) closeDrawer();
        return;
      }
    }
    const nativeToggled = await requestNativeSidePanelToggle();
    if (nativeToggled) {
      nativePanelOpen = true;
      if (drawerOpen) closeDrawer();
      hideNotice(true);
      return;
    }
    if (drawerOpen) {
      drawerDismissed = true;
      closeDrawer();
      return;
    }
    drawerDismissed = false;
    openDrawer();
  }

  // ---- inject a Ledebe button into per-message action rows -----------------

  function makeInlineButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ledebe-inline-btn";
    btn.title = "Open Ledebe panel";
    btn.setAttribute("aria-label", "Open Ledebe panel");
    const url = runtimeUrl("ledebe-icon.png");
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      btn.appendChild(img);
    } else {
      btn.textContent = "L";
    }
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleOverlay();
    });
    return btn;
  }

  // Find each message's action toolbar (the row with Copy etc.) and drop our
  // button in once. Best-effort + resilient to ChatGPT re-renders (keyed off a
  // data flag on the toolbar, re-added if the row is rebuilt).
  function injectInlineButtons() {
    if (!isAiHost()) return;
    // Anchor next to the per-message "Copy" control across the major assistants.
    const copyButtons = document.querySelectorAll(
      '[data-testid="copy-turn-action-button"], [data-testid="copy-button"], '
      + '[data-testid="action-bar-copy"], button[aria-label="Copy"], '
      + 'button[aria-label="Copy message" i], button[aria-label="Copy to clipboard" i], '
      + 'button[aria-label="Copy response" i], button[aria-label="Copy code" i]'
    );
    for (const copyBtn of copyButtons) {
      const bar = copyBtn.parentElement;
      if (!bar || bar.querySelector(".ledebe-inline-btn")) continue;
      bar.appendChild(makeInlineButton());
    }
  }

  let inlineInjectTimer = null;
  function scheduleInlineInjection() {
    if (inlineInjectTimer) return;
    inlineInjectTimer = window.setTimeout(() => {
      inlineInjectTimer = null;
      try {
        injectInlineButtons();
      } catch (error) {
        /* DOM shape changed — ignore */
      }
    }, 400);
  }

  function wireRuntime() {
    if (!hasContext()) return;

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes[COMPANY_TERMS_STORAGE_KEY] || changes[COMPANY_STATE_STORAGE_KEY])) {
        settings.companyTerms = normalizeTerms(changes[COMPANY_TERMS_STORAGE_KEY]?.newValue || settings.companyTerms || []);
        settings.companySync = changes[COMPANY_STATE_STORAGE_KEY]?.newValue || settings.companySync || null;
        if (activeEditable) refreshDrawer();
        return;
      }
      if ((area === "local" || area === "session") && changes[mappingKey()]) {
        const expected = settings.persistMappings ? "local" : "session";
        if (area === expected) {
          loadMap(changes[mappingKey()].newValue || {});
          sweepResponses();
          if (drawerOpen) refreshDrawer();
        }
        return;
      }
      if (area !== "sync") return;
      for (const [key, value] of Object.entries(changes)) settings[key] = value.newValue;
      settings.personalTerms = normalizeTerms(
        settings.personalTerms && settings.personalTerms.length
          ? settings.personalTerms
          : settings.customTerms
      );
      settings.customTerms = settings.personalTerms;
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
        case "GET_STATE":
          sendResponse(buildPageState());
          return true;
        case "PROTECT_VALUE":
          if (message.value) protectValue(message.value);
          sendResponse(buildPageState());
          return true;
        case "UNPROTECT_VALUE":
          if (message.value) unprotectValue(message.value);
          sendResponse(buildPageState());
          return true;
        case "FORGET_VALUE":
          if (message.value) forgetValue(message.value);
          sendResponse(buildPageState());
          return true;
        case "ADD_TERM":
          sendResponse({
            ...buildPageState(),
            actionResult: message.term ? addCustomTerm(message.term) : { ok: false }
          });
          return true;
        case "REMOVE_TERM":
          if (message.term) removeCustomTerm(message.term);
          sendResponse(buildPageState());
          return true;
        case "CLEAR_DATA":
          clearSavedData();
          sendResponse(buildPageState());
          return true;
        case "PANEL_VISIBLE":
          nativePanelOpen = Boolean(message.visible);
          if (nativePanelOpen && drawerOpen) closeDrawer();
          sendResponse({ ok: true });
          return true;
        case "PROTECT_ACTIVE_FIELD":
          protectActiveField();
          sendResponse({ ok: true });
          return true;
        case "TOGGLE_SELECTION_PROTECTION":
          toggleSelectionProtection(message.selectedText);
          sendResponse(buildPageState());
          return true;
        case "OPEN_PANEL":
          if (drawerOpen) {
            drawerDismissed = true;
            closeDrawer();
            sendResponse({ ok: true, open: false });
            return true;
          }
          drawerDismissed = false;
          openDrawer();
          sendResponse({ ok: true, open: true });
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
      scheduleInlineInjection();
      setTimeout(scheduleInlineInjection, 1500);
      setTimeout(scheduleInlineInjection, 3500);
      console.debug("[Ledebe] content script active:", getHost(), "· AI host:", isAiHost());
    });
})();
