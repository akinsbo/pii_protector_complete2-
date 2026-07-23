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
    protectionMode: "mild",
    // Mild is the default preset: keep always-sensitive types on, but avoid the
    // broader heuristics that tend to surprise people in everyday chat.
    detectNames: false,
    detectNumbers: false,
    detectAddresses: true,
    detectCodes: false,
    customTerms: [],
    personalTerms: [],
    pausedHosts: [],
    subscriptionPlan: "free",
    // Where the protected-words utility box pops up. One of: "composer" (anchored
    // to the active text box), "top-right", "bottom-right", "top-left", "bottom-left".
    boxPosition: "composer"
  };

  const BOX_POSITIONS = ["composer", "top-right", "bottom-right", "top-left", "bottom-left"];

  const COMPANY_TERMS_STORAGE_KEY = "ledebeCompanyTerms";
  const COMPANY_STATE_STORAGE_KEY = "ledebeCompanyState";
  const SESSION_PAUSED_HOSTS_KEY = "ledebeSessionPausedHosts";
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

  const PROTECTION_PRESETS = {
    mild: {
      detectNames: false,
      detectNumbers: false,
      detectAddresses: true,
      detectCodes: false
    },
    aggressive: {
      detectNames: true,
      detectNumbers: true,
      detectAddresses: true,
      detectCodes: true
    }
  };

  // Map the category toggles to the detector rule names to skip when off.
  function disabledTypes() {
    const off = [];
    if (settings.detectNames === false) off.push("NAME");
    if (settings.detectNumbers === false) off.push("NUMBER");
    if (settings.detectAddresses === false) off.push("ADDRESS");
    if (settings.detectCodes === false) off.push("ALNUM");
    return off;
  }

  function detectionOptions(extra = {}) {
    return {
      numberMinDigits: settings.protectionMode === "aggressive" ? 5 : 3,
      ...extra
    };
  }

  function inferProtectionMode(source = settings) {
    for (const [mode, preset] of Object.entries(PROTECTION_PRESETS)) {
      if (
        source.detectNames === preset.detectNames
        && source.detectNumbers === preset.detectNumbers
        && source.detectAddresses === preset.detectAddresses
        && source.detectCodes === preset.detectCodes
      ) {
        return mode;
      }
    }
    return "custom";
  }

  async function resumeProtectionForCurrentHost() {
    const host = getHost();
    const pausedHosts = new Set(settings.pausedHosts || []);
    const sessionPausedHosts = new Set(settings.sessionPausedHosts || []);
    let changed = false;
    if (pausedHosts.delete(host)) {
      settings.pausedHosts = Array.from(pausedHosts);
      changed = true;
    }
    if (sessionPausedHosts.delete(host)) {
      settings.sessionPausedHosts = Array.from(sessionPausedHosts);
      changed = true;
    }
    if (!changed) return false;
    await Promise.all([
      syncSet({ pausedHosts: settings.pausedHosts }),
      sessionSet({ [SESSION_PAUSED_HOSTS_KEY]: settings.sessionPausedHosts })
    ]);
    return true;
  }

  async function applyProtectionMode(mode) {
    const preset = PROTECTION_PRESETS[mode];
    if (!preset) return;
    await resumeProtectionForCurrentHost();
    settings = { ...settings, ...preset, protectionMode: mode };
    await syncSet({ ...preset, protectionMode: mode });
    if (activeEditable && settings.autoReplace) liveReplace(activeEditable, true);
    refreshDrawer(true);
    syncComposerToggle();
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

  async function sessionGet(defaults) {
    try {
      return hasContext() ? await chrome.storage.session.get(defaults) : defaults;
    } catch (error) {
      return defaults;
    }
  }

  async function sessionSet(value) {
    try {
      if (hasContext() && chrome.storage?.session) await chrome.storage.session.set(value);
    } catch (error) {
      /* ignore */
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
    const host = getHost();
    return settings.pausedHosts.includes(host) || (settings.sessionPausedHosts || []).includes(host);
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
    const payload = {
      source: "browser-extension",
      category,
      host: host || "unknown",
      message
    };
    if (email) payload.email = email;

    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data?.error || data?.message || "";
      } catch (error) {
        /* ignore non-json errors */
      }
      throw new Error(detail || "Could not send feedback");
    }
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

  const RICH_EDITABLE_SELECTOR =
    '[role="textbox"][contenteditable]:not([contenteditable="false"]), '
    + '[contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]';

  function isContentEditableLike(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (node.isContentEditable) return true;
    // An absent contenteditable attribute reads back as null (not ""), so guard
    // on hasAttribute — otherwise every plain element (body, divs) looks editable.
    if (!node.hasAttribute("contenteditable")) return false;
    const attr = (node.getAttribute("contenteditable") || "").toLowerCase();
    return attr === "" || attr === "true" || attr === "plaintext-only";
  }

  function isEditableElement(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (node instanceof HTMLTextAreaElement) return true;
    if (node instanceof HTMLInputElement) {
      return ["text", "search", "email", "url", "tel", "password"].includes(node.type || "text");
    }
    return isContentEditableLike(node) || node.getAttribute("role") === "textbox";
  }

  // The real composer in a rich AI editor is the [role=textbox] node; resolve to
  // it so we read/write the right element (ChatGPT/Claude/Gemini ProseMirror).
  function getComposer(node) {
    if (!(node instanceof HTMLElement)) return null;
    if (node.matches(RICH_EDITABLE_SELECTOR)) return node;
    return node.closest?.(RICH_EDITABLE_SELECTOR) || node.querySelector?.(RICH_EDITABLE_SELECTOR) || null;
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

  function currentEditable() {
    const candidates = [];
    const pushCandidate = (node) => {
      const editable = resolveEditable(node) || (node instanceof HTMLElement && isEditableElement(node) ? editableRoot(node) || node : null);
      if (!(editable instanceof HTMLElement) || !editable.isConnected || isInsideLedebeUi(editable)) return;
      if (!candidates.includes(editable)) candidates.push(editable);
    };

    pushCandidate(activeEditable);
    pushCandidate(document.activeElement);
    for (const node of document.querySelectorAll(`textarea, input, ${RICH_EDITABLE_SELECTOR}, [role="textbox"]`)) {
      pushCandidate(node);
    }

    if (!candidates.length) return null;

    const scoreFor = (editable) => {
      const text = getFieldText(editable);
      const protectedCount = (text.match(/\[LDB_[A-Z0-9_]+\]/g) || []).length;
      const exposedCount = detectPII(text, allCustomTerms(), disabledTypes(), detectionOptions()).length;
      return (protectedCount * 100) + exposedCount;
    };

    let best = candidates[0];
    let bestScore = scoreFor(best);
    for (const candidate of candidates.slice(1)) {
      const score = scoreFor(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    activeEditable = best;
    return best;
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
    return (clone.innerText || clone.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\n+|\n+$/g, "");
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
      disabledTypes: disabledTypes(),
      ...detectionOptions()
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
    syncComposerToggle();
    maybeOpenDrawer();
  }

  function flashField(element) {
    element.classList.add("ledebe-flash");
    window.setTimeout(() => element.classList.remove("ledebe-flash"), 320);
  }

  // ---- per-item protect / unprotect (drawer actions) ----------------------

  function placeholderPrefixFor(value) {
    const finding = detectPII(value, [], [], detectionOptions()).find((f) => f.value === value);
    return finding ? finding.prefix : "LDB_CUSTOM";
  }

  function placeholderTokensIn(text) {
    return [...new Set((String(text || "").match(/\[LDB_[A-Z0-9_]+\]/g) || []))];
  }

  function protectValue(value) {
    const element = currentEditable();
    if (!element) return;
    activeEditable = element;
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
    const element = currentEditable();
    if (!element) return;
    activeEditable = element;

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

  function restoreMaskedTextInField(element, { stripInstruction = true } = {}) {
    if (!element) return false;
    const current = getFieldText(element);
    if (!current) return false;

    const restoredResult = restorePlaceholders(current, placeholderMap);
    const restored = stripInstruction ? stripRetainNote(restoredResult.restored) : restoredResult.restored;
    if (restored === current) return false;

    applyFieldText(element, restored);
    activeEditable = element;
    refreshDrawer(true);
    syncComposerToggle();
    return true;
  }

  function toggleSelectionProtection(selectedText = "") {
    const element = currentEditable() || resolveEditable(document.activeElement);
    if (!element) {
      toast("Click into a text field first.");
      return;
    }
    activeEditable = element;

    const selection = getSelectedFieldText(element) || selectedText;
    if (!selection) {
      toast("Select text first, or use Protect active field now.");
      refreshDrawer();
      return;
    }
    const tokens = placeholderTokensIn(selection);
    if (!tokens.length && selection) {
      const result = maskText(selection, allCustomTerms(), {
        namespace: placeholderNamespace(),
        exclude: unprotected,
        disabledTypes: disabledTypes(),
        ...detectionOptions()
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
      focusReplacementSelection(element, result.masked, selection);
      activeEditable = element;
      refreshDrawer(true);
      window.setTimeout(() => focusReplacementSelection(element, result.masked, selection), 0);
      window.setTimeout(() => focusReplacementSelection(element, result.masked, selection), 120);
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

  function protectSelectionOnly(selectedText = "") {
    const element = currentEditable() || resolveEditable(document.activeElement);
    if (!element) {
      toast("Click into a text field first.");
      return;
    }
    activeEditable = element;

    const selection = getSelectedFieldText(element) || selectedText;
    if (!selection) {
      toast("Select text first, then use Protect selected text.");
      refreshDrawer();
      return;
    }

    if (placeholderTokensIn(selection).length) {
      toast("That selection is already protected.");
      refreshDrawer();
      return;
    }

    const result = maskText(selection, allCustomTerms(), {
      namespace: placeholderNamespace(),
      exclude: unprotected,
      disabledTypes: disabledTypes(),
      ...detectionOptions()
    });
    let masked = result.masked;
    let replacements = result.replacements;
    if (!replacements.length) {
      const token = createPlaceholderToken(placeholderPrefixFor(selection), placeholderNamespace(), 1);
      masked = token;
      replacements = [{ token, original: selection }];
    }
    rememberReplacements(replacements);
    if (!replaceSelectedFieldText(element, masked, selection, true)) {
      refreshDrawer();
      return;
    }
    focusReplacementSelection(element, masked, selection);
    activeEditable = element;
    refreshDrawer(true);
    window.setTimeout(() => focusReplacementSelection(element, masked, selection), 0);
    window.setTimeout(() => focusReplacementSelection(element, masked, selection), 120);
  }

  function selectionToggleState(element, selectedText = "") {
    if (!element) return { kind: "none" };
    const selection = getSelectedFieldText(element) || selectedText;
    if (!selection) return { kind: "none" };

    if (placeholderTokensIn(selection).length) {
      return { kind: "reveal", selection };
    }

    const result = maskText(selection, allCustomTerms(), {
      namespace: placeholderNamespace(),
      exclude: unprotected,
      disabledTypes: disabledTypes(),
      ...detectionOptions()
    });
    if (result.replacements.length) {
      return { kind: "protect", selection };
    }
    return { kind: "noneSensitive", selection };
  }

  function selectionPopupState(element, selectedText = "") {
    if (!element) return { kind: "none" };
    const selection = getSelectedFieldText(element) || selectedText;
    if (!selection || !selection.trim()) return { kind: "none" };
    if (placeholderTokensIn(selection).length) return { kind: "reveal", selection };
    return { kind: "protect", selection };
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
  function protectActiveField(options = {}) {
    const { forceNotice = false } = options;
    const element = currentEditable();
    if (!element) {
      toast("Click into a text field first.");
      return;
    }
    activeEditable = element;
    const original = getFieldText(element);
    const result = maskText(original, allCustomTerms(), {
      namespace: placeholderNamespace(),
      exclude: unprotected,
      disabledTypes: disabledTypes(),
      ...detectionOptions()
    });
    if (!result.replacements.length) {
      if (protectedItems(original).length) {
        toast("This field is already protected.");
        if (forceNotice && !nativePanelOpen) openDrawer();
        else showNotice({ ignoreNativePanel: forceNotice });
        return;
      }
      toast("Nothing sensitive found in this field.");
      return;
    }
    rememberReplacements(result.replacements);
    applyFieldText(element, result.masked);
    afterProtect(element);
    toast(`Protected ${result.replacements.length} item${result.replacements.length === 1 ? "" : "s"}.`);
    if (forceNotice && !nativePanelOpen) openDrawer();
    else showNotice({ ignoreNativePanel: forceNotice });
  }

  // ---- detection, grouped by value with occurrence counts -----------------
  // Each value appears once; `count` is how many times it occurs, so the panel
  // shows "email ×3" instead of three identical rows.

  // Detected-but-still-plaintext PII in the field.
  function exposedItems(text) {
    if (!text) return [];
    const groups = new Map();
    for (const finding of detectPII(text, allCustomTerms(), disabledTypes(), detectionOptions())) {
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
  let accountSupportOpen = false;
  let settingsBodyScrollTop = 0;
  let autoHideTimer = null;
  let drawerHovered = false;
  const AUTO_HIDE_MS = 5000;
  const PAGE_PUSH_CLASS = "ledebe-page-pushed";
  const PAGE_PUSH_VAR = "--ledebe-panel-offset";
  let notice = null;
  let noticeTimer = null;
  let noticeHovered = false;
  const NOTICE_HIDE_MS = 6000;
  let composerToggle = null;
  let composerHint = null;
  let composerHintTimer = null;
  let composerHintIntroduced = false;
  let selectionPopup = null;
  let dismissedSelectionKey = "";

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

  // ---- protected-words utility box ----------------------------------------
  // A small pop-up that lists what was just protected. Clicking a word reveals
  // (unprotects) it back into the field. It replaces the old "open the panel"
  // notice; the full 50% panel is still reachable from its header button.

  function boxPosition() {
    const pos = settings.boxPosition;
    return BOX_POSITIONS.includes(pos) ? pos : "composer";
  }

  function ensureNotice() {
    if (notice && document.documentElement.contains(notice)) return notice;
    notice = document.createElement("div");
    notice.className = "ledebe-protected-box";
    notice.innerHTML = `
      <div class="ledebe-protected-box__card" role="status" aria-live="polite">
        <div class="ledebe-protected-box__head">
          <span class="ledebe-protected-box__title">Protected</span>
          <button type="button" class="ledebe-protected-box__open">Open panel</button>
        </div>
        <ul class="ledebe-protected-box__list"></ul>
      </div>
    `;
    notice.querySelector(".ledebe-protected-box__open").addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideNotice(true);
      await toggleOverlay();
    });
    // Keep it up while the user is reading / clicking inside it.
    notice.addEventListener("mouseenter", () => {
      noticeHovered = true;
      if (noticeTimer) { clearTimeout(noticeTimer); noticeTimer = null; }
    });
    notice.addEventListener("mouseleave", () => {
      noticeHovered = false;
      scheduleNoticeHide();
    });
    document.documentElement.appendChild(notice);
    return notice;
  }

  // Fill the box with the values currently protected in the active field. Returns
  // the number of rows rendered so callers can skip an empty box.
  function renderProtectedBox() {
    if (!notice) return 0;
    const list = notice.querySelector(".ledebe-protected-box__list");
    if (!list) return 0;
    const items = protectedItems(getFieldText(activeEditable));
    list.innerHTML = "";
    for (const { value, count } of items) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ledebe-protected-box__item";
      btn.title = t("box.unprotect", "Click to unprotect");
      const val = document.createElement("span");
      val.className = "ledebe-protected-box__val";
      val.textContent = count > 1 ? `${value} ×${count}` : value;
      const tag = document.createElement("span");
      tag.className = "ledebe-protected-box__tag";
      tag.textContent = placeholderPrefixFor(value).replace(/^LDB_/, "");
      const x = document.createElement("span");
      x.className = "ledebe-protected-box__x";
      x.textContent = "✕";
      btn.append(val, tag, x);
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        unprotectValue(value);
        if (!renderProtectedBox()) hideNotice(true); // last one revealed → dismiss
        else positionProtectedBox();
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    return items.length;
  }

  // Place the box per the user's setting: a fixed corner, or anchored just above
  // the active composer.
  function positionProtectedBox() {
    if (!notice) return;
    const pos = boxPosition();
    notice.dataset.pos = pos;
    notice.style.top = notice.style.bottom = notice.style.left = notice.style.right = "";
    const margin = 16;
    const rect = notice.getBoundingClientRect();
    const w = rect.width || 300;
    const h = rect.height || 120;
    if (pos === "composer") {
      const target = composerToggleTarget();
      if (target instanceof HTMLElement) {
        const r = target.getBoundingClientRect();
        let top = r.top - h - 10;
        if (top < 8) top = Math.min(r.bottom + 10, window.innerHeight - h - 8);
        const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        notice.style.top = `${Math.max(8, top)}px`;
        notice.style.left = `${left}px`;
        return;
      }
      notice.style.bottom = `${margin}px`;
      notice.style.right = `${margin}px`;
      return;
    }
    if (pos.includes("top")) notice.style.top = `${margin}px`;
    else notice.style.bottom = `${margin}px`;
    if (pos.includes("left")) notice.style.left = `${margin}px`;
    else notice.style.right = `${margin}px`;
  }

  function scheduleNoticeHide() {
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      noticeTimer = null;
      if (!noticeHovered) hideNotice();
    }, NOTICE_HIDE_MS);
  }

  // Reposition a visible box as the page scrolls or the composer grows/moves.
  function syncProtectedBox() {
    if (notice && notice.classList.contains("is-visible")) positionProtectedBox();
  }

  function hideNotice(immediate = false) {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    noticeHovered = false;
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
    }, 220);
  }

  function ensureComposerHint() {
    if (composerHint && document.documentElement.contains(composerHint)) return composerHint;
    composerHint = document.createElement("div");
    composerHint.className = "ledebe-composer-hint";
    composerHint.setAttribute("role", "status");
    composerHint.setAttribute("aria-live", "polite");
    document.documentElement.appendChild(composerHint);
    return composerHint;
  }

  function hideComposerHint(immediate = false) {
    if (composerHintTimer) {
      clearTimeout(composerHintTimer);
      composerHintTimer = null;
    }
    if (!composerHint) return;
    if (immediate) {
      composerHint.classList.remove("is-visible");
      composerHint.remove();
      composerHint = null;
      return;
    }
    composerHint.classList.remove("is-visible");
  }

  function showComposerHint(message, target) {
    if (!message || !(target instanceof HTMLElement)) return;
    const hint = ensureComposerHint();
    hint.textContent = message;
    const rect = target.getBoundingClientRect();
    const top = Math.max(8, rect.top - 36);
    const left = Math.max(8, rect.right - 240);
    hint.style.top = `${top}px`;
    hint.style.left = `${left}px`;
    hint.classList.add("is-visible");
    if (composerHintTimer) clearTimeout(composerHintTimer);
    composerHintTimer = window.setTimeout(() => {
      composerHintTimer = null;
      hideComposerHint();
    }, 2400);
  }

  // `preview` (from the settings position picker) forces the box open so the user
  // can see where it lands, even with the panel open or nothing protected yet.
  function showNotice(options = {}) {
    const { ignoreNativePanel = false, preview = false } = options;
    if (!preview && ((!ignoreNativePanel && nativePanelOpen) || drawerOpen)) return;
    const el = ensureNotice();
    const count = renderProtectedBox();
    if (!count) {
      if (!preview) { hideNotice(true); return; }
      const list = el.querySelector(".ledebe-protected-box__list");
      list.innerHTML = `<li class="ledebe-protected-box__empty">${t("box.empty", "Protected words will appear here.")}</li>`;
    }
    if (noticeTimer) clearTimeout(noticeTimer);
    void el.offsetWidth;
    el.classList.add("is-visible");
    positionProtectedBox();
    scheduleNoticeHide();
  }

  function ensureComposerToggle() {
    if (composerToggle && document.documentElement.contains(composerToggle)) return composerToggle;
    composerToggle = document.createElement("button");
    composerToggle.type = "button";
    composerToggle.id = "ledebe-composer-toggle";
    composerToggle.className = "ledebe-composer-toggle";
    composerToggle.dataset.ledebe = "composer-toggle";
    composerToggle.dataset.ledebePlacement = "unknown";
    composerToggle.setAttribute("aria-label", "Ledebe protection status");
    composerToggle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    composerToggle.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await cycleComposerProtectionMode();
      syncComposerToggle();
      refreshDrawer(true);
    });
    composerToggle.addEventListener("mouseenter", () => {
      showComposerHint(
        composerToggle?.dataset.hint || t("quick.nextAggressive", "Click to switch protection to aggressive mode."),
        composerToggle
      );
    });
    composerToggle.addEventListener("focus", () => {
      showComposerHint(
        composerToggle?.dataset.hint || t("quick.nextAggressive", "Click to switch protection to aggressive mode."),
        composerToggle
      );
    });
    composerToggle.addEventListener("mouseleave", () => hideComposerHint());
    composerToggle.addEventListener("blur", () => hideComposerHint());
    (document.body || document.documentElement).appendChild(composerToggle);
    return composerToggle;
  }

  function ensureContentMarker() {
    if (document.getElementById("ledebe-content-script-marker")) return;
    const marker = document.createElement("meta");
    marker.id = "ledebe-content-script-marker";
    marker.dataset.ledebe = "content-script-marker";
    marker.content = "active";
    (document.head || document.documentElement).appendChild(marker);
  }

  function composerToggleInsets(target) {
    if (!(target instanceof HTMLElement)) return { top: 6, right: 12 };
    if (isPlainField(target)) return { top: 10, right: 12 };
    return { top: 8, right: 14 };
  }

  function composerUsesLeadingOverlay(target) {
    if (!(target instanceof HTMLElement)) return false;
    const host = getHost();
    return host.includes("gemini.google.com")
      || matchesWithin(target, GEMINI_EDITOR_SELECTOR);
  }

  function composerUsesTopRightOverlay(target) {
    if (!(target instanceof HTMLElement)) return false;
    return matchesWithin(target, CLAUDE_EDITOR_SELECTOR);
  }

  function claudeEditable() {
    try {
      const node = document.querySelector(
        '[data-testid="chat-input"][contenteditable="true"], [data-testid="chat-input"].tiptap.ProseMirror, .tiptap.ProseMirror[contenteditable="true"]'
      );
      return node instanceof HTMLElement ? node : null;
    } catch (error) {
      return null;
    }
  }

  function visibleComposerAncestor(node) {
    if (!(node instanceof HTMLElement)) return null;
    let best = null;
    let current = node;
    for (let depth = 0; depth < 8 && current instanceof HTMLElement; depth += 1, current = current.parentElement) {
      if (isInsideLedebeUi(current)) continue;
      const rect = current.getBoundingClientRect();
      if (rect.width >= 300 && rect.height >= 56) {
        best = current;
        const className = String(current.getAttribute("class") || "");
        if (
          current.matches?.("fieldset")
          || className.includes("relative")
          || className.includes("flex-col")
        ) {
          break;
        }
      }
    }
    return best;
  }

  function composerToggleTarget() {
    if (!isAiHost()) return null;
    const target = siteComposerTarget() || currentEditable() || getComposer(activeEditable) || activeEditable;
    if (!(target instanceof HTMLElement) || !target.isConnected || isInsideLedebeUi(target)) return null;
    return target;
  }

  // The floating overlay should only show while the composer is actually active
  // (otherwise a stray dot sits over the page). A pinned toolbar button doesn't
  // need this — it lives in the site's own button row and stays put like theirs.
  function composerToggleIsFocused(target) {
    const focused = document.activeElement;
    return !(
      focused instanceof HTMLElement
      && focused !== target
      && !target.contains(focused)
      && !target.matches(":focus")
    );
  }

  // The composer's own trailing button row (mic / send / voice), so the toggle
  // can sit pinned alongside those controls instead of floating over the text.
  // Selectors are best-effort and site-specific — fall back to null (overlay).
  const COMPOSER_TOOLBAR_SELECTORS = [
    '[class*="grid-area:trailing"]',              // ChatGPT (Tailwind grid-area class)
    '[data-composer-transition-slot="trailing"]', // ChatGPT transition slot
    '[data-testid="composer-trailing-actions"]',
    '.composer-actions', '.input-actions', '.send-button-container'
  ];

  // The send button marks the composer's action row across assistants (Claude
  // and Gemini don't expose a named trailing container, so we anchor off this).
  const SEND_BUTTON_SELECTORS =
    'button[data-testid="send-button"], button[aria-label*="send" i], button[type="submit"]';

  // Trailing controls that are present even when the composer is empty (mic /
  // dictation / voice). Claude only renders its send button once there's text,
  // so we anchor off these too — otherwise the toggle would only show up after a
  // send instead of the whole time.
  const TRAILING_CONTROL_SELECTORS = SEND_BUTTON_SELECTORS
    + ', button[aria-label*="dictat" i], button[aria-label*="microphone" i]'
    + ', button[aria-label*="voice" i], button[aria-label*="read aloud" i]';

  const GEMINI_EDITOR_SELECTOR = '.ql-editor[role="textbox"], .ql-editor[contenteditable], [role="textbox"].ql-editor';
  const GEMINI_LEADING_WRAPPER_SELECTOR = '.leading-actions-wrapper, simplified-input-menu';
  const GEMINI_MIC_WRAPPER_SELECTOR = '[data-node-type="speech_dictation_mic_button"]';
  const GEMINI_MIC_BUTTON_SELECTOR = `${GEMINI_MIC_WRAPPER_SELECTOR} button[aria-label="Microphone"]`;
  const GEMINI_SEND_ICON_SELECTOR = 'mat-icon[data-mat-icon-name="arrow_upward"]';
  const CLAUDE_COMPOSER_SELECTOR = '[data-testid="chat-input"]';
  const CLAUDE_EDITOR_SELECTOR = '.tiptap.ProseMirror, [data-testid="chat-input"], [data-testid="chat-input"] .tiptap, [data-testid="chat-input"] .ProseMirror';

  function siteComposerTarget() {
    const host = getHost();
    if (host.includes("claude.ai")) {
      const editable = claudeEditable();
      if (editable instanceof HTMLElement && editable.isConnected && !isInsideLedebeUi(editable)) {
        activeEditable = editable;
        return editable;
      }
    }
    const selectors = [];
    if (host.includes("claude.ai")) selectors.push(CLAUDE_COMPOSER_SELECTOR, CLAUDE_EDITOR_SELECTOR);
    if (host.includes("gemini.google.com")) selectors.push(GEMINI_EDITOR_SELECTOR);
    if (!selectors.length) return null;
    for (const selector of selectors) {
      try {
        const node = document.querySelector(selector);
        const editable = resolveEditable(node) || getComposer(node) || node;
        if (editable instanceof HTMLElement && editable.isConnected && !isInsideLedebeUi(editable)) {
          activeEditable = editable;
          return editable;
        }
      } catch (error) {
        /* ignore */
      }
    }
    return null;
  }

  function directChildWithin(parent, node) {
    if (!(parent instanceof HTMLElement) || !(node instanceof HTMLElement)) return null;
    let cur = node;
    while (cur && cur.parentElement && cur.parentElement !== parent) {
      cur = cur.parentElement;
    }
    return cur?.parentElement === parent ? cur : null;
  }

  function rowControlChildren(row, target) {
    if (!(row instanceof HTMLElement)) return [];
    let nodes = [];
    try { nodes = row.querySelectorAll(TRAILING_CLUSTER_SELECTORS); } catch (error) { return []; }
    const seen = new Set();
    const out = [];
    for (const node of nodes) {
      if (!(node instanceof HTMLElement) || node === target || node.contains(target) || isInsideLedebeUi(node)) continue;
      const child = directChildWithin(row, node);
      if (!(child instanceof HTMLElement) || seen.has(child)) continue;
      seen.add(child);
      out.push(child);
    }
    return out;
  }

  function controlRowAnchor(row, target, preferred = null) {
    if (!(row instanceof HTMLElement) || row.contains(target) || isInsideLedebeUi(row)) return null;
    const controls = rowControlChildren(row, target);
    if (!controls.length) return null;
    const preferredChild = preferred instanceof HTMLElement ? directChildWithin(row, preferred) : null;
    return {
      el: row,
      before: preferredChild || controls[0]
    };
  }

  function bestControlRow(primaryControl, target, secondaryControl = null) {
    if (!(primaryControl instanceof HTMLElement) || !(target instanceof HTMLElement)) return null;
    let best = null;
    let row = primaryControl.parentElement;
    for (let depth = 0; depth < 6 && row instanceof HTMLElement; depth += 1, row = row.parentElement) {
      if (row.contains(target) || isInsideLedebeUi(row)) continue;
      const controls = rowControlChildren(row, target);
      if (!controls.length) continue;
      const includesPrimary = controls.some((control) => control === directChildWithin(row, primaryControl));
      const includesSecondary = !(secondaryControl instanceof HTMLElement)
        || controls.some((control) => control === directChildWithin(row, secondaryControl));
      if (!includesPrimary || !includesSecondary) continue;
      const candidate = {
        el: row,
        before: controls[0],
        score: controls.length
      };
      if (!best || candidate.score > best.score) best = candidate;
    }
    return best ? { el: best.el, before: best.before } : null;
  }

  function matchesWithin(target, selector) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.matches(selector)) return true;
    return Boolean(target.closest?.(selector) || target.querySelector?.(selector));
  }

  function leadingComposerAnchor(target) {
    if (!(target instanceof HTMLElement)) return null;
    const host = getHost();
    if (!host.includes("gemini.google.com")) return null;
    let scope = target.parentElement;
    for (let depth = 0; depth < 6 && scope instanceof HTMLElement; depth += 1, scope = scope.parentElement) {
      let wrapper = null;
      let plusButton = null;
      try {
        plusButton = scope.querySelector('button[aria-label*="upload" i], button[aria-label*="tool" i], button[aria-haspopup="menu"], button');
      } catch (error) {
        plusButton = null;
      }
      const preferredAnchor = plusButton instanceof HTMLElement
        ? plusButton.closest('.toolbox-drawer-container, simplified-input-menu, .leading-actions-wrapper')
        : null;
      wrapper = preferredAnchor instanceof HTMLElement ? preferredAnchor : null;
      if (!(wrapper instanceof HTMLElement)) {
        try { wrapper = scope.querySelector(GEMINI_LEADING_WRAPPER_SELECTOR); } catch (error) { wrapper = null; }
      }
      if (!(wrapper instanceof HTMLElement) || wrapper.contains(target) || isInsideLedebeUi(wrapper)) continue;
      try {
        plusButton = plusButton instanceof HTMLElement ? plusButton : wrapper.querySelector('button[aria-label*="upload" i], button[aria-label*="tool" i], button[aria-haspopup="menu"], button');
      } catch (error) {
        plusButton = null;
      }
      const plusChild = plusButton instanceof HTMLElement ? directChildWithin(wrapper, plusButton) : null;
      if (plusChild instanceof HTMLElement) {
        const after = plusChild.nextElementSibling;
        return { el: wrapper, before: after instanceof HTMLElement ? after : null };
      }
      return { el: wrapper, before: null };
    }
    return null;
  }

  function geminiToolbarAnchor(target, scope) {
    if (!(target instanceof HTMLElement) || !(scope instanceof HTMLElement)) return null;
    if (!matchesWithin(target, GEMINI_EDITOR_SELECTOR)) return null;
    let micWrap = null;
    let sendIcon = null;
    try {
      micWrap = scope.querySelector(GEMINI_MIC_WRAPPER_SELECTOR);
      sendIcon = scope.querySelector(GEMINI_SEND_ICON_SELECTOR);
    } catch (error) {
      return null;
    }
    if (!(micWrap instanceof HTMLElement) || micWrap.contains(target)) return null;
    const sendButton = sendIcon instanceof HTMLElement ? sendIcon.closest('button, [role="button"]') : null;
    return bestControlRow(micWrap, target, sendButton)
      || bestControlRow(sendButton, target, micWrap)
      || controlRowAnchor(micWrap.parentElement, target, null);
  }

  function claudeToolbarAnchor(target, scope) {
    if (!(target instanceof HTMLElement) || !(scope instanceof HTMLElement)) return null;
    if (!matchesWithin(target, CLAUDE_EDITOR_SELECTOR)) return null;
    let sendButton = null;
    let micButton = null;
    try {
      sendButton = scope.querySelector(SEND_BUTTON_SELECTORS);
      micButton = scope.querySelector('button[aria-label*="dictat" i], button[aria-label*="microphone" i], button[aria-label*="voice" i]');
    } catch (error) {
      return null;
    }
    const control = sendButton instanceof HTMLElement ? sendButton : micButton;
    if (!(control instanceof HTMLElement) || control.contains(target) || isInsideLedebeUi(control)) return null;
    return bestControlRow(control, target, sendButton instanceof HTMLElement ? micButton : sendButton)
      || controlRowAnchor(control.parentElement, target, control);
  }

  // Returns { el, before } describing where to pin the toggle: `el` is the
  // toolbar to inject into, `before` is a node to insert ahead of (the send
  // button, so we sit just left of it) or null to append at the end.
  function composerToolbarAnchor(target) {
    if (!(target instanceof HTMLElement)) return null;
    // Climb a few levels from the composer, looking for the site's trailing
    // toolbar or the row that holds its action buttons. The anchor must NOT
    // contain the editable itself, so the toggle can never land over the text.
    let scope = target.parentElement;
    for (let depth = 0; depth < 6 && scope instanceof HTMLElement; depth += 1, scope = scope.parentElement) {
      for (const selector of COMPOSER_TOOLBAR_SELECTORS) {
        let el = null;
        try { el = scope.querySelector(selector); } catch (error) { /* bad selector on this engine */ }
        if (el instanceof HTMLElement && !isInsideLedebeUi(el) && !el.contains(target)) {
          return { el, before: null }; // named trailing container → append (ChatGPT)
        }
      }
      const geminiAnchor = geminiToolbarAnchor(target, scope);
      if (geminiAnchor) return geminiAnchor;
      const claudeAnchor = claudeToolbarAnchor(target, scope);
      if (claudeAnchor) return claudeAnchor;
      // The trailing action group: the parent of the first trailing control.
      let control = null;
      try { control = scope.querySelector(TRAILING_CONTROL_SELECTORS); } catch (error) { /* ignore */ }
      const genericAnchor = controlRowAnchor(control?.parentElement, target, control);
      if (genericAnchor) return genericAnchor;
    }
    return null;
  }

  // The left edge (viewport x) of the composer's trailing-controls cluster — the
  // mic / send / model-picker buttons that sit in the editable's row on its right.
  // Used only to POSITION the floating dot just left of ALL of them (like
  // QuillBot), so it never lands on top of one. Returns null if none found.
  const TRAILING_CLUSTER_SELECTORS =
    'button, [role="button"], select, [aria-haspopup], [role="combobox"]';
  function composerTrailingBound(target, rect) {
    if (!(target instanceof HTMLElement) || !rect) return null;
    let scope = target.parentElement;
    for (let depth = 0; depth < 6 && scope instanceof HTMLElement; depth += 1, scope = scope.parentElement) {
      let nodes = [];
      try { nodes = scope.querySelectorAll(TRAILING_CLUSTER_SELECTORS); } catch (error) { continue; }
      let minLeft = Infinity;
      for (const el of nodes) {
        if (!(el instanceof HTMLElement) || isInsideLedebeUi(el) || el.contains(target) || el === target) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.top >= rect.bottom - 2 || r.bottom <= rect.top + 2) continue; // must share the editable's row
        if (r.left <= rect.left + rect.width * 0.6) continue;               // must be a right-side control
        if (r.left < minLeft) minLeft = r.left;
      }
      if (minLeft !== Infinity) return minLeft;
    }
    return null;
  }

  function composerOverlayHost(target) {
    if (!(target instanceof HTMLElement)) return null;
    if (composerUsesTopRightOverlay(target)) {
      const editable = claudeEditable();
      const visualHost = visibleComposerAncestor(editable || target);
      return visualHost
        || target.closest?.("fieldset")
        || target.parentElement;
    }
    return getComposer(target) || target;
  }

  function composerOverlayRect(target, rect) {
    const host = composerOverlayHost(target);
    if (!(host instanceof HTMLElement)) return rect;
    try {
      const hostRect = host.getBoundingClientRect();
      if (hostRect.width >= rect.width && hostRect.height >= rect.height) return hostRect;
    } catch (error) {
      /* ignore */
    }
    return rect;
  }

  function composerLeadingBound(target, rect) {
    if (!(target instanceof HTMLElement) || !rect) return null;
    let scope = target.parentElement;
    for (let depth = 0; depth < 6 && scope instanceof HTMLElement; depth += 1, scope = scope.parentElement) {
      let nodes = [];
      try { nodes = scope.querySelectorAll(TRAILING_CLUSTER_SELECTORS); } catch (error) { continue; }
      let maxRight = -Infinity;
      let bestRect = null;
      for (const el of nodes) {
        if (!(el instanceof HTMLElement) || isInsideLedebeUi(el) || el.contains(target) || el === target) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.top >= rect.bottom - 2 || r.bottom <= rect.top + 2) continue; // must share the editable's row
        if (r.right >= rect.left + rect.width * 0.45) continue;              // must be a left-side control
        if (r.right > maxRight) {
          maxRight = r.right;
          bestRect = r;
        }
      }
      if (bestRect) return bestRect;
    }
    return null;
  }

  function hideComposerToggle() {
    composerToggle?.classList.remove("is-visible");
    if (composerToggle) composerToggle.dataset.ledebeVisible = "false";
    hideComposerHint(true);
  }

  async function setSitePausedForSession(paused) {
    const host = getHost();
    const pausedHosts = new Set(settings.sessionPausedHosts || []);
    if (paused) pausedHosts.add(host);
    else pausedHosts.delete(host);
    settings.sessionPausedHosts = Array.from(pausedHosts);
    await sessionSet({ [SESSION_PAUSED_HOSTS_KEY]: settings.sessionPausedHosts });
  }

  async function cycleComposerProtectionMode() {
    const button = ensureComposerToggle();
    if (isPaused()) {
      await setSitePausedForSession(false);
      await applyProtectionMode("mild");
      showComposerHint(t("quick.mildHint", "Mild protection is on."), button);
      return;
    }
    if (settings.protectionMode === "aggressive") {
      const element = currentEditable();
      await setSitePausedForSession(true);
      if (element) restoreMaskedTextInField(element);
      syncComposerToggle();
      showComposerHint(t("quick.offHint", "Protection is off for this site right now."), button);
      return;
    }
    await setSitePausedForSession(false);
    await applyProtectionMode("aggressive");
    showComposerHint(t("quick.aggressiveHint", "Aggressive protection is on."), button);
  }

  function ensureSelectionPopup() {
    if (selectionPopup && document.documentElement.contains(selectionPopup)) return selectionPopup;
    selectionPopup = document.createElement("div");
    selectionPopup.className = "ledebe-selection-popup";
    selectionPopup.innerHTML = `
      <button type="button" class="ledebe-selection-popup__action"></button>
      <button type="button" class="ledebe-selection-popup__dismiss"></button>
    `;
    const action = selectionPopup.querySelector(".ledebe-selection-popup__action");
    const dismiss = selectionPopup.querySelector(".ledebe-selection-popup__dismiss");
    selectionPopup.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    action?.addEventListener("click", () => {
      const mode = selectionPopup?.dataset.mode;
      const selectedText = selectionPopup?.dataset.selection || "";
      dismissedSelectionKey = "";
      hideSelectionPopup();
      if (mode === "reveal") toggleSelectionProtection(selectedText);
      else protectSelectionOnly(selectedText);
    });
    dismiss?.addEventListener("click", () => {
      dismissedSelectionKey = selectionPopup?.dataset.key || "";
      hideSelectionPopup();
    });
    document.documentElement.appendChild(selectionPopup);
    return selectionPopup;
  }

  function hideSelectionPopup() {
    selectionPopup?.classList.remove("is-visible");
  }

  function selectionPopupInteracting() {
    return Boolean(
      selectionPopup
      && selectionPopup.classList.contains("is-visible")
      && (
        selectionPopup.matches(":hover")
        || selectionPopup.contains(document.activeElement)
      )
    );
  }

  function selectionPopupRect(element) {
    if (!element) return null;
    if (!isPlainField(element)) {
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect && (rect.width || rect.height)) return rect;
      }
    }
    return element.getBoundingClientRect();
  }

  function syncSelectionPopup() {
    if (!isAiHost()) {
      hideSelectionPopup();
      return;
    }
    if (selectionPopupInteracting()) return;
    const element = currentEditable() || resolveEditable(document.activeElement);
    const state = selectionPopupState(element);
    if (state.kind === "none") {
      dismissedSelectionKey = "";
      hideSelectionPopup();
      return;
    }
    const key = `${state.kind}:${state.selection}`;
    if (dismissedSelectionKey && dismissedSelectionKey === key) {
      hideSelectionPopup();
      return;
    }
    const rect = selectionPopupRect(element);
    if (!rect) {
      hideSelectionPopup();
      return;
    }
    const popup = ensureSelectionPopup();
    const action = popup.querySelector(".ledebe-selection-popup__action");
    const dismiss = popup.querySelector(".ledebe-selection-popup__dismiss");
    popup.dataset.mode = state.kind;
    popup.dataset.selection = state.selection;
    popup.dataset.key = key;
    if (action) {
      action.textContent = state.kind === "reveal"
        ? t("selection.reveal", "Unprotect selection")
        : t("selection.protect", "Protect selection");
    }
    if (dismiss) dismiss.textContent = t("selection.dismiss", "Not now");
    const top = Math.max(8, rect.top - 42);
    const left = Math.max(8, rect.left + Math.min(rect.width / 2, 120));
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.classList.add("is-visible");
  }

  function syncComposerToggle() {
    const target = composerToggleTarget();
    if (!target) {
      const button = ensureComposerToggle();
      button.dataset.ledebePlacement = "hidden:no-target";
      button.dataset.ledebeVisible = "false";
      hideComposerToggle();
      return;
    }
    const rect = target.getBoundingClientRect();
    const placementRect = composerOverlayRect(target, rect);
    if (placementRect.width < 150 || placementRect.height < 28) {
      const button = ensureComposerToggle();
      button.dataset.ledebePlacement = "hidden:small-rect";
      button.dataset.ledebeRect = `${Math.round(placementRect.width)}x${Math.round(placementRect.height)}`;
      button.dataset.ledebeVisible = "false";
      hideComposerToggle();
      return;
    }
    const button = ensureComposerToggle();
    button.classList.toggle("is-paused", isPaused());
    button.classList.toggle("is-aggressive", !isPaused() && settings.protectionMode === "aggressive");
    button.classList.toggle("is-mild", !isPaused() && settings.protectionMode !== "aggressive");
    const statusText = isPaused()
      ? t("quick.stateOff", "Ledebe is off for this session")
      : settings.protectionMode === "aggressive"
        ? t("quick.stateAggressive", "Ledebe is on in aggressive mode")
        : t("quick.stateMild", "Ledebe is on in mild mode");
    const actionText = isPaused()
      ? t("quick.nextMild", "Click to turn protection on in mild mode.")
      : settings.protectionMode === "aggressive"
        ? t("quick.nextOff", "Click to turn protection off.")
        : t("quick.nextAggressive", "Click to switch protection to aggressive mode.");
    button.dataset.hint = actionText;
    button.title = `${statusText}. ${actionText}`;
    button.setAttribute("aria-label", `${statusText}. ${actionText}`);
    // Prefer pinning the toggle inside the composer's trailing toolbar (like
    // QuillBot) so it flows with the layout instead of chasing the growing text
    // rect. Fall back to the fixed overlay when no toolbar anchor is found.
    const leadingAnchorInfo = composerUsesLeadingOverlay(target) ? leadingComposerAnchor(target) : null;
    const anchorInfo = composerToolbarAnchor(target);
    if (leadingAnchorInfo) {
      const anchor = leadingAnchorInfo.el;
      const before = leadingAnchorInfo.before;
      button.classList.add("is-pinned");
      button.classList.add("is-visible");
      button.dataset.ledebePlacement = "leading-pinned";
      button.dataset.ledebeVisible = "true";
      button.style.top = "";
      button.style.left = "";
      if (before instanceof HTMLElement && before.parentElement === anchor && before !== button) {
        if (button.nextElementSibling !== before) anchor.insertBefore(button, before);
      } else if (button.parentElement !== anchor) {
        anchor.appendChild(button);
      }
    } else if (anchorInfo && !composerUsesLeadingOverlay(target) && !composerUsesTopRightOverlay(target)) {
      // Pinned into the site's toolbar: persist like the site's own buttons,
      // whether or not the composer currently has focus.
      const anchor = anchorInfo.el;
      const before = anchorInfo.before;
      button.classList.add("is-pinned");
      button.classList.add("is-visible");
      button.dataset.ledebePlacement = "trailing-pinned";
      button.dataset.ledebeVisible = "true";
      button.style.top = "";
      button.style.left = "";
      if (before instanceof HTMLElement && before.parentElement === anchor && before !== button) {
        if (button.nextElementSibling !== before) anchor.insertBefore(button, before);
      } else if (button.parentElement !== anchor) {
        anchor.appendChild(button);
      }
    } else {
      button.classList.remove("is-pinned");
      // Claude prefers a QuillBot-style top-right badge inside the composer box.
      // Gemini prefers the left-side fallback when we cannot pin after upload.
      button.classList.add("is-visible");
      button.dataset.ledebePlacement = composerUsesTopRightOverlay(target)
        ? "top-right-overlay"
        : (composerUsesLeadingOverlay(target) ? "leading-overlay" : "trailing-overlay");
      button.dataset.ledebeVisible = "true";
      const root = document.body || document.documentElement;
      if (button.parentElement !== root) {
        root.appendChild(button);
      }
      const width = button.offsetWidth || 16;
      const height = button.offsetHeight || 16;
      let top;
      let left;
      const overlayRect = composerOverlayRect(target, rect);
      // Sit just LEFT of the composer's entire trailing-controls cluster (model
      // picker + mic + send, like Gemini's "Flash" dropdown next to the mic), so
      // the dot is clearly visible and never lands on top of one of them. Fall
      // back to the editable's right edge when there's no such cluster.
      const trailingLeft = composerTrailingBound(target, rect);
      const leadingControl = composerLeadingBound(target, rect);
      const inset = composerToggleInsets(target);
      const minTop = overlayRect.top + inset.top;
      const maxTop = overlayRect.bottom - height - inset.top;
      const centeredTop = overlayRect.top + ((overlayRect.height - height) / 2);
      top = Math.min(maxTop, Math.max(minTop, centeredTop));
      if (composerUsesTopRightOverlay(target)) {
        top = overlayRect.top + inset.top;
        left = overlayRect.right - width - inset.right;
      } else if (composerUsesLeadingOverlay(target)) {
        if (leadingControl) {
          left = leadingControl.right + 10;
          const controlCenteredTop = leadingControl.top + ((leadingControl.height - height) / 2);
          top = Math.min(maxTop, Math.max(minTop, controlCenteredTop));
        } else {
          left = overlayRect.left + 12;
        }
      } else if (trailingLeft != null && trailingLeft > rect.left) {
        const gap = 8;
        left = trailingLeft - width - gap;
      } else {
        left = overlayRect.right - width - inset.right;
      }
      top = Math.max(10, Math.min(window.innerHeight - height - 4, top));
      left = Math.max(10, Math.min(window.innerWidth - width - 4, left));
      button.style.top = `${top}px`;
      button.style.left = `${left}px`;
    }
    if (!composerHintIntroduced) {
      composerHintIntroduced = true;
      showComposerHint(
        t("quick.introHint", "Green is mild, amber is aggressive, and red turns protection off."),
        button
      );
    }
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

  const PLACEHOLDER_TOKEN_RE = /\[LDB_[A-Z0-9_]+\]/g;
  const BULLET_LINE_RE = /^\s*[-*•]\s+/;
  const BULLET_ONLY_RE = /^\s*[-*•]\s*$/;

  function appendInlineText(container, text) {
    let lastIndex = 0;
    for (const match of text.matchAll(PLACEHOLDER_TOKEN_RE)) {
      const token = match[0];
      const index = match.index || 0;
      if (index > lastIndex) {
        container.append(document.createTextNode(text.slice(lastIndex, index)));
      }
      const chip = document.createElement("code");
      chip.className = "ledebe-msg__token";
      chip.textContent = token;
      container.append(chip);
      lastIndex = index + token.length;
    }
    if (lastIndex < text.length) {
      container.append(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function normalizeBulletLines(lines) {
    const normalized = [];
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (BULLET_ONLY_RE.test(line)) {
        const next = lines[index + 1];
        if (next && !BULLET_LINE_RE.test(next) && !BULLET_ONLY_RE.test(next)) {
          normalized.push(`- ${String(next).trim()}`);
          index += 1;
          continue;
        }
      }
      normalized.push(line);
    }
    return normalized;
  }

  function appendParagraphText(container, text) {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      appendInlineText(container, line);
      if (index < lines.length - 1) container.append(document.createElement("br"));
    });
  }

  function buildFormattedBlock(text) {
    const fragment = document.createDocumentFragment();
    const paragraphs = String(text || "")
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const paragraphText of paragraphs) {
      const lines = normalizeBulletLines(
        paragraphText.split("\n").map((line) => line.trimEnd()).filter(Boolean)
      );
      const isList = lines.length > 0 && lines.every((line) => BULLET_LINE_RE.test(line));
      if (isList) {
        const list = document.createElement("ul");
        list.className = "ledebe-msg__list";
        for (const line of lines) {
          const item = document.createElement("li");
          item.className = "ledebe-msg__list-item";
          appendInlineText(item, line.replace(BULLET_LINE_RE, ""));
          list.appendChild(item);
        }
        fragment.appendChild(list);
        continue;
      }
      const paragraph = document.createElement("p");
      paragraph.className = "ledebe-msg__paragraph";
      appendParagraphText(paragraph, paragraphText);
      fragment.appendChild(paragraph);
    }

    return fragment;
  }

  function latestAssistantText(turns) {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index];
      if (turn?.role !== "assistant") continue;
      const text = (turn.blocks || []).map((block) => block.text).filter(Boolean).join("\n\n").trim();
      if (text) return text;
    }
    return "";
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
      drawerButton(t("settings.protectField", "Protect active field now"), "primary", () => protectActiveField()),
      drawerButton(t("field.protectSelection", "Protect selected text"), "secondary", () => protectSelectionOnly())
    );
    return wrap;
  }

  const USER_TURN_SELECTORS =
    '[data-message-author-role="user"], [data-message-author="user"], '
    + '[data-testid="user-message"], [data-testid="conversation-turn-user"], '
    + '.font-user-message, [data-message-role="user"], user-query, '
    + '[data-test-id="message-user"], [data-message-type="user"]';

  function uniqueTurnNodes(selector) {
    const nodes = [];
    for (const el of document.querySelectorAll(selector)) {
      if (isInsideLedebeUi(el)) continue;
      const parentTurn = el.parentElement?.closest(selector);
      if (parentTurn) continue;
      if (!(el.innerText || el.textContent || "").trim()) continue;
      nodes.push(el);
    }
    return nodes;
  }

  function assistantContainerFromCopyButton(button) {
    if (!(button instanceof HTMLElement)) return null;
    const actionBar = button.parentElement;
    const siblings = [];
    if (actionBar?.previousElementSibling instanceof HTMLElement) siblings.push(actionBar.previousElementSibling);
    if (actionBar?.parentElement instanceof HTMLElement) {
      siblings.push(...Array.from(actionBar.parentElement.children).filter((child) => child !== actionBar));
    }
    for (const candidate of siblings) {
      if (!(candidate instanceof HTMLElement) || candidate.contains(button) || isInsideLedebeUi(candidate)) continue;
      if (readStructuredText(candidate)) return candidate;
    }
    return null;
  }

  function assistantTurnNodes() {
    const turns = [];
    const hasEquivalentTurn = (candidate) => turns.some((turn) => turn === candidate || turn.contains(candidate) || candidate.contains(turn));
    const addTurn = (candidate) => {
      if (!(candidate instanceof HTMLElement) || hasEquivalentTurn(candidate)) return;
      turns.push(candidate);
    };
    for (const el of uniqueTurnNodes(ASSISTANT_SELECTORS)) {
      addTurn(el);
    }
    for (const button of document.querySelectorAll(COPY_BUTTON_SELECTORS)) {
      const candidate = assistantContainerFromCopyButton(button);
      addTurn(candidate);
    }
    return turns;
  }

  // Mirror the conversation, restored, across the major assistants. Returns
  // turns ({ role, blocks }) in document order; empty when the page markup isn't
  // recognised (the Home tab then falls back to the latest restored reply).
  function collectRestoredTranscript() {
    const turns = [
      ...uniqueTurnNodes(USER_TURN_SELECTORS).map((el) => ({ role: "user", el })),
      ...assistantTurnNodes().map((el) => ({ role: "assistant", el }))
    ].sort((a, b) => {
      if (a.el === b.el) return 0;
      const pos = a.el.compareDocumentPosition(b.el);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    return turns.flatMap(({ role, el }) => {
      const blocks = restoredBlocksFor(el);
      return blocks.length ? [{ role, blocks }] : [];
    });
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
        if (block.kind === "code") text.textContent = block.text;
        else text.appendChild(buildFormattedBlock(block.text));
        blk.append(bhead, text);
        msg.appendChild(blk);
      }
      body.appendChild(msg);
    }

    body.appendChild(copyButton(t("home.copyReply", "Copy restored reply"), () =>
      latestAssistantText(turns) || latestRestoredText || ""));
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
    const text = getFieldText(currentEditable());
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
        body.appendChild(rowEl("session", item.value, meta, "Forget", () => forgetValue(item.value)));
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
      if (["detectNames", "detectNumbers", "detectAddresses", "detectCodes"].includes(key)) {
        settings.protectionMode = inferProtectionMode(settings);
      }
      await syncSet({ [key]: input.checked, protectionMode: settings.protectionMode });
      if (activeEditable && settings.autoReplace) liveReplace(activeEditable, true);
      refreshDrawer(true);
    });
    wrap.append(span, input);
    return wrap;
  }

  // Advanced-settings control: where the protected-words box pops up. Changing it
  // previews the box in the new spot so the user can try positions.
  function boxPositionPicker() {
    const wrap = document.createElement("label");
    wrap.className = "ledebe-toggle ledebe-box-pos";
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = t("settings.boxPosition", "Protected-words box position");
    const small = document.createElement("small");
    small.textContent = t("settings.boxPositionHint", "Where the pop-up appears when words are protected.");
    span.append(strong, small);
    const select = document.createElement("select");
    select.className = "ledebe-box-pos__select";
    const options = [
      ["composer", t("settings.posComposer", "Near the composer")],
      ["top-right", t("settings.posTopRight", "Top right")],
      ["bottom-right", t("settings.posBottomRight", "Bottom right")],
      ["top-left", t("settings.posTopLeft", "Top left")],
      ["bottom-left", t("settings.posBottomLeft", "Bottom left")]
    ];
    for (const [value, label] of options) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
    }
    select.value = boxPosition();
    select.addEventListener("change", async () => {
      settings.boxPosition = BOX_POSITIONS.includes(select.value) ? select.value : "composer";
      await syncSet({ boxPosition: settings.boxPosition });
      showNotice({ preview: true, ignoreNativePanel: true }); // show where it now lands
    });
    wrap.append(span, select);
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

  function protectionModePicker() {
    const wrap = document.createElement("div");
    wrap.className = "ledebe-mode-picker";

    const currentMode = inferProtectionMode(settings);
    const options = [
      {
        mode: "mild",
        label: t("settings.modeMild", "Mild"),
        hint: t("settings.modeMildHint", "Protects clearly sensitive data, but leaves broad guesses like ordinals and generic codes alone.")
      },
      {
        mode: "aggressive",
        label: t("settings.modeAggressive", "Aggressive"),
        hint: t("settings.modeAggressiveHint", "Also protects names, number runs, and mixed letter-number tokens.")
      }
    ];

    for (const option of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ledebe-mode-option${currentMode === option.mode ? " is-active" : ""}`;
      button.innerHTML = `
        <strong>${escapeHtml(option.label)}</strong>
        <span>${escapeHtml(option.hint)}</span>
      `;
      button.addEventListener("click", () => applyProtectionMode(option.mode));
      wrap.appendChild(button);
    }

    if (currentMode === "custom") {
      const custom = document.createElement("p");
      custom.className = "ledebe-drawer__lead";
      custom.textContent = t("settings.modeCustomHint", "Custom mix active — advanced toggles no longer match the built-in presets.");
      wrap.appendChild(custom);
    }

    return wrap;
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
    syncComposerToggle();
  }

  async function pauseSiteForSession() {
    const host = getHost();
    const paused = new Set(settings.sessionPausedHosts || []);
    if (paused.has(host)) paused.delete(host); else paused.add(host);
    settings.sessionPausedHosts = Array.from(paused);
    await sessionSet({ [SESSION_PAUSED_HOSTS_KEY]: settings.sessionPausedHosts });
    refreshDrawer(true);
    syncComposerToggle();
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
    
    const accountSupport = document.createElement("details");
    accountSupport.className = "ledebe-advanced";
    accountSupport.open = accountSupportOpen;
    accountSupport.addEventListener("toggle", () => { accountSupportOpen = accountSupport.open; });
    const accountSummary = document.createElement("summary");
    accountSummary.textContent = t("settings.accountSupport", "Subscription, company sync and feedback");
    accountSupport.appendChild(accountSummary);
    accountSupport.appendChild(status);
    accountSupport.appendChild(planLine);

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
    accountSupport.appendChild(companyCard);

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
    accountSupport.appendChild(feedbackCard);
    body.appendChild(accountSupport);

    const protectionCard = drawerCard();
    protectionCard.appendChild(sectionEl(t("settings.protectionControls", "Protection controls")));
    protectionCard.appendChild(settingsToggle("enabled", t("settings.protectionOn", "Protection on"), t("settings.protectionHint", "Master switch for detection and masking."), settings.enabled !== false));
    protectionCard.appendChild(settingsToggle("autoReplace", t("settings.replace", "Replace as I type"), t("settings.replaceHint", "Mask each value live, before send."), settings.autoReplace !== false));
    protectionCard.appendChild(settingsToggle("restoreResponses", t("settings.restore", "Reveal replies here"), t("settings.restoreHint", "Show the reply with real values in this panel."), settings.restoreResponses !== false));
    protectionCard.appendChild(sectionEl(t("settings.mode", "Protection style")));
    protectionCard.appendChild(leadEl(t("settings.modeLead", "Choose how broad Ledebe should be when it guesses what to protect.")));
    if (isPaused()) {
      protectionCard.appendChild(leadEl(t("settings.pausedHint", "Protection is currently paused on this site. Choosing Mild or Aggressive will turn it back on.")));
    }
    protectionCard.appendChild(protectionModePicker());
    body.appendChild(protectionCard);

    const siteActionsCard = drawerCard();
    siteActionsCard.appendChild(sectionEl(t("settings.siteActions", "Site actions")));
    siteActionsCard.appendChild(drawerButton(t("settings.protectField", "Protect active field now"), "primary", () => protectActiveField()));
    siteActionsCard.appendChild(drawerButton(t("field.protectSelection", "Protect selected text"), "secondary", () => protectSelectionOnly()));
    const paused = (storedSettings.pausedHosts || []).includes(host);
    const sessionPaused = (settings.sessionPausedHosts || []).includes(host);
    siteActionsCard.appendChild(drawerButton(
      sessionPaused ? t("settings.resumeSession", "Resume this session") : t("settings.pauseSession", "Pause for this session"),
      "secondary",
      pauseSiteForSession
    ));
    siteActionsCard.appendChild(drawerButton(paused ? t("settings.resume", "Resume on this site") : t("settings.pause", "Pause on this site"), "secondary", pauseSite));
    body.appendChild(siteActionsCard);

    const adv = document.createElement("details");
    adv.className = "ledebe-advanced";
    adv.open = advancedOpen;
    adv.addEventListener("toggle", () => { advancedOpen = adv.open; });
    const summary = document.createElement("summary");
    summary.textContent = t("settings.advanced", "Advanced settings");
    adv.appendChild(summary);

    adv.appendChild(boxPositionPicker());
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
    body.scrollTop = settingsBodyScrollTop;
  }

  function refreshDrawer(force = false) {
    if (!drawerOpen || !drawer) return;
    if (activeTab === "settings") {
      settingsBodyScrollTop = drawer.querySelector(".ledebe-drawer__body")?.scrollTop || 0;
    }
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

  // Set briefly when the user sends: the panel should vanish the moment send is
  // clicked and stay gone while the message goes out, even though masking right
  // before send injects placeholders that would otherwise reopen it.
  let suppressReopenUntil = 0;

  function dismissForSend() {
    suppressReopenUntil = Date.now() + 1500;
    if (drawerOpen) closeDrawer();
    hideNotice(true);
  }

  function maybeOpenDrawer() {
    if (Date.now() < suppressReopenUntil) {
      if (drawerOpen) closeDrawer();
      hideNotice(true);
      return;
    }
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
      const keepCurrentTab = drawerOpen && (activeTab === "words" || activeTab === "settings");
      if (!keepCurrentTab) activeTab = "field";
      // Never auto-open the full panel — it covers the composer and reads as
      // intrusive. Keep an already-open panel fresh; otherwise just show the
      // small notice so the user can open it themselves if they want to.
      if (drawerOpen) refreshDrawer(!keepCurrentTab);
      else showNotice();
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

  const COPY_BUTTON_SELECTORS =
    '[data-testid="copy-turn-action-button"], [data-testid="copy-button"], '
    + '[data-testid="action-bar-copy"], button[aria-label="Copy"], '
    + 'button[aria-label="Copy message" i], button[aria-label="Copy to clipboard" i], '
    + 'button[aria-label="Copy response" i], button[aria-label="Copy code" i]';
  const ASSISTANT_SELECTORS =
    '[data-message-author-role="assistant"], [data-message-author="assistant"], '
    + '[data-testid="assistant-message"], [data-testid="conversation-turn-assistant"], '
    + '[data-test-id="message-assistant"], [data-message-role="assistant"], [data-message-type="model"], '
    + '.model-response-text, message-content, model-response, [data-testid="model-response"], '
    + 'div.agent-turn, .font-claude-message, .markdown.prose, [data-is-streaming]';
  const TURN_MARKERS =
    '[data-message-author-role], [data-message-author], [data-testid="assistant-message"], [data-testid="user-message"], '
    + '[data-testid="conversation-turn-assistant"], [data-testid="conversation-turn-user"], '
    + '[data-test-id="message-assistant"], [data-test-id="message-user"], '
    + '[data-message-role], [data-message-type], message-content, model-response, .model-response-text, [data-is-streaming], '
    + COPY_BUTTON_SELECTORS;
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
    if (el.closest(`input, textarea, ${RICH_EDITABLE_SELECTOR}, [role="textbox"]`)) return true;
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
      const container = root.closest(ASSISTANT_SELECTORS) || assistantContainerFromCopyButton(root.closest(COPY_BUTTON_SELECTORS)) || root;
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
    scheduleComposerToggleSync(); // re-pin the composer toggle if a re-render dropped it
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
      for (const el of assistantTurnNodes()) queued = queueRoot(el) || queued;
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
      syncComposerToggle();
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
    syncComposerToggle();
    maybeOpenDrawer();
  }

  function onPaste(event) {
    if (!settings.scanOnPaste) return;
    const target = trackTarget(event) || eventEditable(event) || activeEditable;
    if (!target) return;
    activeEditable = target;
    syncComposerToggle();
    // After the pasted text lands, force-protect it directly. We don't gate this
    // on selfEdit or the caret guard, so every paste (not just the first) masks.
    window.setTimeout(() => {
      try { liveReplace(target, true); } catch (error) { console.debug("[Ledebe]", error); }
      maybeOpenDrawer();
    }, 60);
  }

  // Right before send (Enter / send button), force-mask anything still exposed.
  function flushBeforeSend() {
    dismissForSend();
    const target = currentEditable() || resolveEditable(document.activeElement);
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
    dismissForSend();
    const field = activeEditable && form.contains(activeEditable) ? activeEditable
      : Array.from(form.querySelectorAll(`textarea, input, ${RICH_EDITABLE_SELECTOR}, [role="textbox"]`)).find(isEditableElement);
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
    const session = await sessionGet({
      [SESSION_PAUSED_HOSTS_KEY]: []
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
      companySync: local[COMPANY_STATE_STORAGE_KEY] || null,
      sessionPausedHosts: normalizeTerms(session[SESSION_PAUSED_HOSTS_KEY] || [])
    };
    settings.protectionMode = inferProtectionMode(settings);
  }

  // ---- state + actions shared with the native side panel ------------------

  // A full snapshot of what both panels render, computed on demand so the native
  // side panel can poll the active tab without us writing to storage per key.
  function buildPageState() {
    const text = getFieldText(currentEditable());
    const prot = protectedItems(text);
    const fieldValues = new Set(prot.map((p) => p.value));
    return {
      host: getHost(),
      paused: isPaused(),
      sessionPaused: (settings.sessionPausedHosts || []).includes(getHost()),
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

  async function syncNativeSidePanelState() {
    if (!hasContext() || typeof chrome.runtime?.sendMessage !== "function") return false;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (visible) => {
        if (settled) return;
        settled = true;
        nativePanelOpen = Boolean(visible);
        if (nativePanelOpen && drawerOpen) closeDrawer();
        resolve(nativePanelOpen);
      };
      const timer = window.setTimeout(() => finish(false), 180);
      try {
        chrome.runtime.sendMessage({ type: "GET_SIDE_PANEL_VISIBILITY" }, (response) => {
          window.clearTimeout(timer);
          try {
            if (chrome.runtime?.lastError) {
              finish(false);
              return;
            }
          } catch (error) {
            /* ignore */
          }
          finish(response?.visible);
        });
      } catch (error) {
        window.clearTimeout(timer);
        finish(false);
      }
    });
  }

  async function toggleOverlay() {
    await syncNativeSidePanelState();
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
    const copyButtons = document.querySelectorAll(COPY_BUTTON_SELECTORS);
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

  // The pinned composer toggle lives inside the site's own (React-managed)
  // toolbar, so a re-render can strip it out. Re-sync on DOM churn so it heals
  // itself instead of vanishing after the first protection. Debounced, and a
  // no-op when the button is already in place, so it can't loop on its own edits.
  let toggleSyncTimer = null;
  function scheduleComposerToggleSync() {
    if (toggleSyncTimer) return;
    toggleSyncTimer = window.setTimeout(() => {
      toggleSyncTimer = null;
      try {
        syncComposerToggle();
      } catch (error) {
        /* DOM shape changed — ignore */
      }
    }, 150);
  }

  function wireRuntime() {
    if (!hasContext()) return;

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "session" && changes[SESSION_PAUSED_HOSTS_KEY]) {
        settings.sessionPausedHosts = normalizeTerms(changes[SESSION_PAUSED_HOSTS_KEY]?.newValue || []);
        if (activeEditable) refreshDrawer(true);
        return;
      }
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
      settings.protectionMode = inferProtectionMode(settings);
      if (activeEditable) refreshDrawer();
      syncComposerToggle();
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
          protectActiveField({ forceNotice: message.source !== "panel" });
          sendResponse({ ok: true });
          return true;
        case "PROTECT_SELECTION":
          protectSelectionOnly(message.selectedText);
          sendResponse(buildPageState());
          return true;
        case "TOGGLE_SELECTION_PROTECTION":
          toggleSelectionProtection(message.selectedText);
          sendResponse(buildPageState());
          return true;
        case "OPEN_PANEL":
          if (nativePanelOpen) {
            if (drawerOpen) closeDrawer();
            sendResponse({ ok: true, open: false, native: true });
            return true;
          }
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
    .then(async () => {
      // Attach protection listeners immediately once settings + map are loaded.
      // The native side-panel sync below waits on a background round-trip that
      // can be slow (service-worker wake-up), and protection must not be dead
      // while it resolves — so wire input handling first, then sync the panel.
      document.addEventListener("focusin", onFocusIn, true);
      document.addEventListener("beforeinput", onInput, true);
      document.addEventListener("input", onInput, true);
      document.addEventListener("paste", onPaste, true);
      document.addEventListener("keydown", onKeyDown, true);
      document.addEventListener("keyup", syncComposerToggle, true);
      document.addEventListener("keyup", syncSelectionPopup, true);
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("pointerup", syncComposerToggle, true);
      document.addEventListener("pointerup", syncSelectionPopup, true);
      document.addEventListener("selectionchange", syncComposerToggle, true);
      document.addEventListener("selectionchange", syncSelectionPopup, true);
      document.addEventListener("submit", onSubmit, true);
      window.addEventListener("resize", syncComposerToggle, true);
      window.addEventListener("resize", syncSelectionPopup, true);
      window.addEventListener("resize", syncProtectedBox, true);
      window.addEventListener("scroll", syncComposerToggle, true);
      window.addEventListener("scroll", syncSelectionPopup, true);
      window.addEventListener("scroll", syncProtectedBox, true);
      startResponseObserver();
      scheduleInlineInjection();
      setTimeout(scheduleInlineInjection, 1500);
      setTimeout(scheduleInlineInjection, 3500);
      if (isAiHost()) {
        document.documentElement.dataset.ledebeContentScript = "active";
        ensureContentMarker();
        ensureComposerToggle();
      }
      syncComposerToggle();
      // Claude/Gemini render their composer asynchronously after first paint, so
      // re-sync a couple of times to surface the status dot without waiting for a
      // scroll / focus. The mutation observer also re-syncs on later DOM churn.
      setTimeout(syncComposerToggle, 1500);
      setTimeout(syncComposerToggle, 3500);
      syncSelectionPopup();
      console.debug("[Ledebe] content script active:", getHost(), "· AI host:", isAiHost());
      await syncNativeSidePanelState();
    });
})();
