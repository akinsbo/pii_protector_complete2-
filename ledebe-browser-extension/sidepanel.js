const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const LATEST_RESTORED_KEY = "ledebeLatestRestored";

const DEFAULTS = {
  enabled: true,
  autoReplace: true,
  scanOnPaste: true,
  restoreResponses: true,
  persistMappings: true,
  appendInstruction: true,
  protectionMode: "mild",
  detectNames: false,
  detectNumbers: false,
  detectAddresses: true,
  detectCodes: false,
  customTerms: [],
  personalTerms: [],
  pausedHosts: [],
  subscriptionPlan: "free"
};

const COMPANY_API_BASE = "https://m9ur273451.execute-api.us-east-2.amazonaws.com";
const ACTIVATION_API_BASE = COMPANY_API_BASE;
const FEEDBACK_ENDPOINT = "https://formspree.io/f/xdkogqpv";
const COMPANY_TERMS_STORAGE_KEY = "ledebeCompanyTerms";
const COMPANY_STATE_STORAGE_KEY = "ledebeCompanyState";
const ACTIVATION_STATE_STORAGE_KEY = "ledebeActivationState";
const SESSION_PAUSED_HOSTS_KEY = "ledebeSessionPausedHosts";
const ACTIVATION_STATUS_REFRESH_MS = 15 * 60 * 1000;
const PERSONAL_TERM_LIMITS = {
  free: 20,
  pro: Infinity,
  team: Infinity,
  enterprise: Infinity
};

let activeTab = "home";
let state = null;     // latest GET_STATE snapshot
let pollTimer = null;
let advancedOpen = false;
let accountSupportOpen = false;
let flashTimer = null;

const body = document.getElementById("body");
const $ = (sel, root = document) => root.querySelector(sel);
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

function inferProtectionMode(settings) {
  for (const [mode, preset] of Object.entries(PROTECTION_PRESETS)) {
    if (
      settings.detectNames === preset.detectNames
      && settings.detectNumbers === preset.detectNumbers
      && settings.detectAddresses === preset.detectAddresses
      && settings.detectCodes === preset.detectCodes
    ) return mode;
  }
  return "custom";
}

async function resumeProtectionForHost(host) {
  if (!host) return false;
  const syncSettings = await chrome.storage.sync.get(DEFAULTS);
  const sessionState = await chrome.storage.session.get({ [SESSION_PAUSED_HOSTS_KEY]: [] });
  const pausedHosts = new Set(syncSettings.pausedHosts || []);
  const sessionPausedHosts = new Set(sessionState[SESSION_PAUSED_HOSTS_KEY] || []);
  let changed = false;
  if (pausedHosts.delete(host)) changed = true;
  if (sessionPausedHosts.delete(host)) changed = true;
  if (!changed) return false;
  await Promise.all([
    chrome.storage.sync.set({ pausedHosts: Array.from(pausedHosts) }),
    chrome.storage.session.set({ [SESSION_PAUSED_HOSTS_KEY]: Array.from(sessionPausedHosts) })
  ]);
  return true;
}

async function applyProtectionMode(mode) {
  const preset = PROTECTION_PRESETS[mode];
  if (!preset) return;
  const tab = await getActiveTab();
  await resumeProtectionForHost(tab?.url ? new URL(tab.url).hostname : "");
  await chrome.storage.sync.set({ ...preset, protectionMode: mode });
}

// ---- messaging -----------------------------------------------------------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function announceNativePanelVisibility(visible) {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  try {
    await chrome.runtime.sendMessage({ type: "SIDE_PANEL_VISIBILITY", visible, tabId: tab.id });
  } catch (error) {
    /* ignore */
  }
}

async function sendToTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) return null;
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    return null; // no content script on this page (e.g. chrome:// or a new tab)
  }
}

async function refreshState() {
  const next = await sendToTab({ type: "GET_STATE" });
  if (next) {
    state = next;
    render(); // poll: only the live tabs (Home/Protected words) rebuild
  } else if (!state) {
    renderNoPage();
  }
}

async function act(message) {
  const next = await sendToTab(message);
  if (next) { state = next; render(true); } // force: reflect the action immediately
}

// ---- helpers -------------------------------------------------------------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function row(kind, primary, secondary, action, onClick) {
  const r = el("button", `row row--${kind}`);
  r.type = "button";
  r.append(el("span", "row__dot"));
  const text = el("span", "row__text");
  text.append(el("span", "row__value", primary), el("span", "row__meta", secondary));
  r.append(text, el("span", "row__action", action));
  r.addEventListener("click", onClick);
  return r;
}

function collapsibleCard(title, { badge = "", open = false } = {}) {
  const details = document.createElement("details");
  details.className = "card card--collapsible";
  details.open = open;

  const summary = el("summary", "card__summary");
  const titleWrap = el("span", "card__summary-copy");
  titleWrap.append(el("span", "card__summary-title", title));
  if (badge) titleWrap.append(el("span", "card__summary-badge", badge));
  summary.append(titleWrap, el("span", "card__summary-chevron", ""));

  const content = el("div", "card__content");
  details.append(summary, content);
  return { details, content };
}

function copyButton(label, getText) {
  const btn = el("button", "btn btn--ghost", label);
  btn.type = "button";
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = t("common.copied", "Copied");
      setTimeout(() => { btn.textContent = label; }, 1200);
    } catch (error) { /* clipboard blocked */ }
  });
  return btn;
}

function fieldActions() {
  const wrap = el("div", "stack stack--actions");
  const protectBtn = el("button", "btn btn--primary", t("settings.protectField", "Protect active field now"));
  protectBtn.type = "button";
  protectBtn.addEventListener("click", () => act({ type: "PROTECT_ACTIVE_FIELD", source: "panel" }));
  const toggleBtn = el("button", "btn btn--secondary", t("field.protectSelection", "Protect selected text"));
  toggleBtn.type = "button";
  toggleBtn.addEventListener("click", () => act({ type: "PROTECT_SELECTION" }));
  wrap.append(protectBtn, toggleBtn);
  return wrap;
}

function showFlash(message, kind = "info") {
  let node = document.getElementById("flash");
  if (!node) {
    node = el("div", "flash");
    node.id = "flash";
    body.prepend(node);
  }
  node.className = `flash flash--${kind}`;
  node.textContent = message;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    if (node) node.remove();
  }, 2400);
}

function feedbackCategoryForHost(host) {
  if (host?.includes("gemini")) return "gemini-extension";
  if (host?.includes("claude")) return "claude-extension";
  return "browser-extension";
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

async function getStoredSettings() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  const personalTerms = normalizeTerms(
    settings.personalTerms && settings.personalTerms.length ? settings.personalTerms : settings.customTerms
  );
  return {
    ...settings,
    customTerms: personalTerms,
    personalTerms
  };
}

async function getSessionState() {
  const result = await chrome.storage.session.get({
    [SESSION_PAUSED_HOSTS_KEY]: []
  });
  return {
    sessionPausedHosts: normalizeTerms(result[SESSION_PAUSED_HOSTS_KEY] || [])
  };
}

async function getCompanyState() {
  const result = await chrome.storage.local.get({
    [COMPANY_STATE_STORAGE_KEY]: null,
    [COMPANY_TERMS_STORAGE_KEY]: []
  });
  return {
    companySync: result[COMPANY_STATE_STORAGE_KEY],
    companyTerms: normalizeTerms(result[COMPANY_TERMS_STORAGE_KEY] || [])
  };
}

async function getActivationState() {
  const result = await chrome.storage.local.get({
    [ACTIVATION_STATE_STORAGE_KEY]: null
  });
  return result[ACTIVATION_STATE_STORAGE_KEY];
}

async function setActivationState(nextState) {
  await chrome.storage.local.set({
    [ACTIVATION_STATE_STORAGE_KEY]: nextState
  });
}

async function clearActivationState() {
  await chrome.storage.local.remove([ACTIVATION_STATE_STORAGE_KEY]);
  await chrome.storage.sync.set({ subscriptionPlan: "free" });
}

function effectivePlanFromData(settings, companySync) {
  return companySync?.companyId ? "team" : (settings.subscriptionPlan || "free");
}

function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
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
  const next = await sendToTab({ type: "GET_STATE" });
  if (next) state = next;
}

async function syncCompanyTerms(force = false) {
  const { companySync } = await getCompanyState();
  if (!companySync?.companyId || !companySync.teamKey) {
    showFlash("Join a company first.", "warn");
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

async function redeemActivationCode(code) {
  const response = await fetch(`${ACTIVATION_API_BASE}/activation/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      activationCode: code.trim().toUpperCase(),
      extensionVersion: chrome.runtime.getManifest?.().version || null,
      deviceLabel: navigator.userAgent.slice(0, 120)
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not redeem activation code");

  const nextState = {
    sessionToken: data.sessionToken,
    sessionExpiresAt: data.sessionExpiresAt,
    lastValidatedAt: new Date().toISOString(),
    plan: data.plan,
    features: data.features || [],
    activationCodeMasked: data.activationCodeMasked || null,
    privacyBoundary: data.privacyBoundary || null
  };
  await setActivationState(nextState);
  await chrome.storage.sync.set({ subscriptionPlan: data.plan || "pro" });
  await refreshStateIfAvailable();
  return nextState;
}

async function syncActivationSession(force = false) {
  const activationState = await getActivationState();
  if (!activationState?.sessionToken) return null;

  const lastValidated = activationState.lastValidatedAt ? new Date(activationState.lastValidatedAt).getTime() : 0;
  if (!force && activationState.sessionExpiresAt && new Date(activationState.sessionExpiresAt).getTime() > Date.now()
    && (Date.now() - lastValidated) < ACTIVATION_STATUS_REFRESH_MS) {
    return activationState;
  }

  const response = await fetch(`${ACTIVATION_API_BASE}/activation/session`, {
    headers: {
      Authorization: `Bearer ${activationState.sessionToken}`
    }
  });

  if (response.status === 401) {
    await clearActivationState();
    await refreshStateIfAvailable();
    return null;
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not validate activation");

  const nextState = {
    ...activationState,
    sessionExpiresAt: data.sessionExpiresAt || activationState.sessionExpiresAt,
    lastValidatedAt: new Date().toISOString(),
    plan: data.plan || activationState.plan,
    features: data.features || activationState.features || [],
    activationCodeMasked: data.activationCodeMasked || activationState.activationCodeMasked,
    privacyBoundary: data.privacyBoundary || activationState.privacyBoundary || null
  };
  await setActivationState(nextState);
  await chrome.storage.sync.set({ subscriptionPlan: nextState.plan || "pro" });
  await refreshStateIfAvailable();
  return nextState;
}

async function logoutActivationSession() {
  const activationState = await getActivationState();
  if (activationState?.sessionToken) {
    try {
      await fetch(`${ACTIVATION_API_BASE}/activation/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activationState.sessionToken}`
        }
      });
    } catch (error) {
      /* ignore network failures on local logout */
    }
  }
  await clearActivationState();
  await refreshStateIfAvailable();
}

async function openPricingPage() {
  await chrome.tabs.create({ url: "https://ledebe.com/pricing/" });
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

// Small per-message copy button, like the one on ChatGPT's reply blocks.
function msgCopyButton(getTextOrString) {
  const btn = el("button", "msg__copy", t("common.copy", "Copy"));
  btn.type = "button";
  btn.title = t("common.copy", "Copy");
  btn.addEventListener("click", async () => {
    const text = typeof getTextOrString === "function" ? getTextOrString() : getTextOrString;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = t("common.copied", "Copied");
      setTimeout(() => { btn.textContent = t("common.copy", "Copy"); }, 1200);
    } catch (error) { /* clipboard blocked */ }
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
    const chip = el("code", "msg__token", token);
    container.append(chip);
    lastIndex = index + token.length;
  }
  if (lastIndex < text.length) {
    container.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function appendParagraphText(container, text) {
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    appendInlineText(container, line);
    if (index < lines.length - 1) container.append(document.createElement("br"));
  });
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

function latestAssistantText(turns) {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn?.role !== "assistant") continue;
    const text = (turn.blocks || []).map((block) => block.text).filter(Boolean).join("\n\n").trim();
    if (text) return text;
  }
  return "";
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
      const list = el("ul", "msg__list");
      for (const line of lines) {
        const item = el("li", "msg__list-item");
        appendInlineText(item, line.replace(BULLET_LINE_RE, ""));
        list.append(item);
      }
      fragment.append(list);
      continue;
    }
    const paragraph = el("p", "msg__paragraph");
    appendParagraphText(paragraph, paragraphText);
    fragment.append(paragraph);
  }

  return fragment;
}

// ---- render --------------------------------------------------------------

function renderNoPage() {
  $("#session-count").textContent = t("panel.openAi", "Open an AI chat to begin");
  body.innerHTML = "";
  body.append(el("p", "empty", t("panel.noPage", "Ledebe is active on AI chat pages. Open one (ChatGPT, Claude, Gemini…) and your protected values will appear here.")));
}

let renderedTab = null;

function setTab(tab) {
  activeTab = tab;
  render(true);
}

// Home and "Protected words" are live (rebuilt on each poll). Custom words and
// Settings hold inputs/collapsibles, so they only rebuild on tab switch or after
// an action (force) — otherwise polling would steal focus / collapse panels.
function render(force = false) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === activeTab));
  if (!state && activeTab !== "words" && activeTab !== "settings") {
    renderNoPage();
    renderedTab = null;
    return;
  }
  $("#session-count").textContent = state
    ? `${state.sessionCount} value${state.sessionCount === 1 ? "" : "s"} protected this session`
    : "Manage your settings and custom words";

  const live = activeTab === "home" || activeTab === "field";
  if (!live && !force && renderedTab === activeTab) return;
  renderedTab = activeTab;

  if (activeTab === "settings") { renderSettings(); return; }
  body.innerHTML = "";
  if (activeTab === "home") renderHome();
  else if (activeTab === "words") renderWords();
  else renderField();
}

function renderHome() {
  body.append(el("p", "lead", t("home.lead", "Your chat with real values restored — shown only here. The page itself keeps the placeholders.")));
  const turns = state.transcript || [];
  if (!turns.length) {
    if (state.latestRestored) {
      body.append(el("pre", "restored", state.latestRestored));
      body.append(copyButton(t("home.copyReply", "Copy restored reply"), () => state.latestRestored));
    } else {
      body.append(el("p", "empty", t("home.noReply", "No restored content yet. Send a protected prompt and the chat will mirror here with your real values.")));
    }
    return;
  }
  for (const turn of turns) {
    const msg = el("div", `msg msg--${turn.role === "assistant" ? "assistant" : "user"}`);
    msg.append(el("div", "msg__role", turn.role === "assistant" ? t("home.assistant", "Assistant") : t("home.you", "You")));
    for (const block of turn.blocks || []) {
      const blk = el("div", "msg__block" + (block.kind === "code" ? " is-code" : ""));
      const bhead = el("div", "msg__bhead");
      bhead.append(msgCopyButton(block.text)); // copies just this block
      const text = el("div", "msg__text");
      if (block.kind === "code") text.textContent = block.text;
      else text.append(buildFormattedBlock(block.text));
      blk.append(bhead, text);
      msg.append(blk);
    }
    body.append(msg);
  }
  body.append(copyButton(t("home.copyReply", "Copy restored reply"), () =>
    latestAssistantText(turns) || state.latestRestored || ""));
}

async function renderWords() {
  const settings = await getStoredSettings();
  const { companySync, companyTerms } = await getCompanyState();
  const personalTerms = settings.personalTerms || [];
  const plan = effectivePlanFromData(settings, companySync);
  const limit = personalLimitForPlan(plan);

  body.innerHTML = "";
  body.append(el("p", "lead", t("words.lead", "Always protect these words — names, project codes, client terms. Company-managed words apply automatically, and your own personal words are added on top.")));

  const meta = el("div", "stack");
  meta.append(
    el("div", "pill", `Plan: ${plan}`),
    el("div", "pill", Number.isFinite(limit) ? `${personalTerms.length}/${limit} personal words` : `${personalTerms.length} personal words`)
  );
  body.append(meta);

  const add = el("div", "words-add");
  const input = el("input", "words-input");
  input.type = "text";
  input.placeholder = t("words.placeholder", "Add a word or phrase…");
  const btn = el("button", "words-btn", t("words.add", "Add"));
  btn.type = "button";
  const submit = async () => {
    const value = input.value.trim();
    if (!value) return;
    const allTerms = normalizeTerms([...companyTerms, ...personalTerms]);
    if (allTerms.some((term) => term.toLowerCase() === value.toLowerCase())) {
      showFlash(t("words.duplicateWarn", "That word is already protected."), "warn");
      return;
    }
    if (Number.isFinite(limit) && personalTerms.length >= limit) {
      showFlash(t("words.limitWarn", "Your {plan} plan allows {limit} personal custom words.", { plan, limit }), "warn");
      return;
    }
    const nextPersonalTerms = normalizeTerms([...personalTerms, value]);
    await chrome.storage.sync.set({
      personalTerms: nextPersonalTerms,
      customTerms: nextPersonalTerms
    });
    input.value = "";
    await refreshStateIfAvailable();
    showFlash(t("words.saved", "Custom word saved."), "ok");
    render(true);
  };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } });
  add.append(input, btn);
  body.append(add);

  if (companyTerms.length) {
    body.append(el("div", "section", t("words.companySection", "Company words ({count})", { count: companyTerms.length })));
    body.append(el("p", "lead", companySync?.companyName
      ? t("words.companyLead", "Managed by {company}. These do not count against your personal-word limit.", { company: companySync.companyName })
      : t("words.companyLeadFallback", "Managed by your company admin.")));
    for (const term of companyTerms) {
      body.append(row("protected", term, t("words.companyManaged", "company-managed"), t("words.locked", "Locked"), () => {}));
    }
  }

  if (!personalTerms.length) {
    body.append(el("p", "empty", companyTerms.length ? t("words.noPersonal", "No personal custom words yet.") : t("words.none", "No custom words yet.")));
    return;
  }

  body.append(el("div", "section", t("words.personalSection", "Personal words ({count})", { count: personalTerms.length })));
  for (const term of personalTerms) {
    body.append(row("protected", term, t("words.customWord", "custom word"), t("common.remove", "Remove"), async () => {
      const nextPersonalTerms = personalTerms.filter((item) => item.toLowerCase() !== term.toLowerCase());
      await chrome.storage.sync.set({
        personalTerms: nextPersonalTerms,
        customTerms: nextPersonalTerms
      });
      await refreshStateIfAvailable();
      showFlash(t("words.removed", "Custom word removed."), "ok");
      render(true);
    }));
  }
}

function times(count) {
  return count > 1 ? `${count}×` : "";
}

function renderField() {
  const exposed = state.exposed || [];
  const prot = state.protected || [];
  const session = state.session || [];

  body.append(fieldActions());

  if (exposed.length) {
    body.append(el("div", "section", `Exposed (${exposed.length})`));
    for (const item of exposed) {
      const meta = [item.label, times(item.count)].filter(Boolean).join(" · ");
      body.append(row("exposed", item.value, meta, "Protect",
        () => act({ type: "PROTECT_VALUE", value: item.value })));
    }
  }
  if (prot.length) {
    body.append(el("div", "section", `Protected (${prot.length})`));
    for (const item of prot) {
      const meta = item.count > 1 ? `protected · ${item.count}×` : "protected";
      body.append(row("protected", item.value, meta, "Unprotect",
        () => act({ type: "UNPROTECT_VALUE", value: item.value })));
    }
  }
  if (session.length) {
    body.append(el("div", "section", `Protected this session (${session.length})`));
    for (const item of session) {
      const meta = item.count > 1 ? `${item.count} placeholders` : "1 placeholder";
      body.append(row("session", item.value, meta, "Forget",
        () => act({ type: "FORGET_VALUE", value: item.value })));
    }
  }
  if (!exposed.length && !prot.length && !session.length) {
    body.append(el("p", "empty", t("field.none", "No sensitive data detected in this field.")));
  }
}

function toggleRow(key, label, hint, checked) {
  const wrap = el("label", "toggle");
  const span = el("span");
  span.append(el("strong", null, label), el("small", null, hint));
  const input = el("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", async () => {
    const settings = await getStoredSettings();
    settings[key] = input.checked;
    const protectionMode = ["detectNames", "detectNumbers", "detectAddresses", "detectCodes"].includes(key)
      ? inferProtectionMode(settings)
      : settings.protectionMode;
    await chrome.storage.sync.set({ [key]: input.checked, protectionMode });
  });
  wrap.append(span, input);
  return wrap;
}

function modePicker(settings) {
  const wrap = el("div", "mode-picker");
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
    const button = el("button", `mode-option${currentMode === option.mode ? " is-active" : ""}`);
    button.type = "button";
    button.append(el("strong", null, option.label), el("span", null, option.hint));
    button.addEventListener("click", async () => {
      await applyProtectionMode(option.mode);
      await refreshState();
      renderSettings();
    });
    wrap.append(button);
  }

  if (currentMode === "custom") {
    wrap.append(el("p", "lead", t("settings.modeCustomHint", "Custom mix active — advanced toggles no longer match the built-in presets.")));
  }

  return wrap;
}

async function renderSettings() {
  const settings = await getStoredSettings();
  settings.protectionMode = inferProtectionMode(settings);
  const { sessionPausedHosts } = await getSessionState();
  const { companySync, companyTerms } = await getCompanyState();
  let activationState = await getActivationState();
  body.innerHTML = "";
  $("#session-count").textContent =
    `${state ? state.sessionCount : 0} value${(state && state.sessionCount === 1) ? "" : "s"} protected this session`;

  if (activationState?.sessionToken) {
    try {
      activationState = await syncActivationSession(false);
    } catch (error) {
      showFlash(error instanceof Error ? error.message : "Could not refresh activation", "warn");
    }
  }

  const host = state?.host;
  const line = el("div", "status-line");
  line.append(el("span", null, t("settings.currentSite", "Current site")));
  line.append(el("strong", null, host || "—"));
  const planLine = el("div", "status-line");
  const plan = effectivePlanFromData(settings, companySync);
  const limit = personalLimitForPlan(plan);
  planLine.append(el("span", null, t("settings.subscription", "Subscription")));
  planLine.append(el("strong", null, Number.isFinite(limit) ? `${plan} · ${settings.personalTerms.length}/${limit} personal words` : `${plan} · unlimited personal words`));

  const accountSupport = document.createElement("details");
  accountSupport.className = "advanced";
  accountSupport.open = accountSupportOpen;
  accountSupport.addEventListener("toggle", () => { accountSupportOpen = accountSupport.open; });
  const accountSummary = document.createElement("summary");
  accountSummary.textContent = t("settings.accountSupport", "Subscription, company sync and feedback");
  accountSupport.append(accountSummary, line, planLine);

  const activationCard = collapsibleCard(
    t("settings.activation", "Browser Pro activation"),
    {
      badge: activationState?.sessionToken ? t("settings.activationActive", "Active") : "",
      open: Boolean(activationState?.sessionToken)
    }
  );
  if (activationState?.sessionToken) {
    activationCard.content.append(el("p", "lead", t("settings.activationActiveLead", "Pro is active on this browser. Ledebe stores billing and entitlement status only; your custom words stay on this device.")));
    const statusLine = el("div", "status-line");
    statusLine.append(el("span", null, t("settings.activationStatus", "Status")));
    statusLine.append(el("strong", null, t("settings.activationActive", "Active")));
    activationCard.content.append(statusLine);

    const codeLine = el("div", "status-line");
    codeLine.append(el("span", null, t("settings.activationCodeLabel", "Activation code")));
    codeLine.append(el("strong", null, activationState.activationCodeMasked || "—"));
    activationCard.content.append(codeLine);

    const expiryLine = el("div", "status-line");
    expiryLine.append(el("span", null, t("settings.activationValidUntil", "Session valid until")));
    expiryLine.append(el("strong", null, formatWhen(activationState.sessionExpiresAt)));
    activationCard.content.append(expiryLine);

    if (activationState.privacyBoundary) {
      activationCard.content.append(el("p", "lead", activationState.privacyBoundary));
    }

    const checkBtn = el("button", "btn btn--primary", t("settings.activationRefresh", "Check activation"));
    checkBtn.type = "button";
    checkBtn.addEventListener("click", async () => {
      checkBtn.disabled = true;
      try {
        await syncActivationSession(true);
        showFlash(t("settings.activationChecked", "Activation is still active."), "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Could not check activation", "warn");
      } finally {
        checkBtn.disabled = false;
      }
    });
    activationCard.content.append(checkBtn);

    const removeBtn = el("button", "btn btn--secondary", t("settings.activationRemove", "Remove activation from this browser"));
    removeBtn.type = "button";
    removeBtn.addEventListener("click", async () => {
      await logoutActivationSession();
      showFlash(t("settings.activationRemoved", "Activation removed from this browser."), "ok");
      renderSettings();
    });
    activationCard.content.append(removeBtn);
  } else {
    activationCard.content.append(el("p", "lead", t("settings.activationLead", "Pay on ledebe.com/pricing, then paste the activation code you receive. Ledebe servers do not store your custom words.")));
    const activationCodeInput = el("input", "words-input");
    activationCodeInput.type = "text";
    activationCodeInput.placeholder = t("settings.activationCode", "Activation code");
    const activateBtn = el("button", "btn btn--primary", t("settings.activationRedeem", "Activate Pro"));
    activateBtn.type = "button";
    activateBtn.addEventListener("click", async () => {
      const code = activationCodeInput.value.trim();
      if (!code) {
        showFlash(t("settings.activationMissing", "Enter your activation code."), "warn");
        return;
      }
      activateBtn.disabled = true;
      try {
        await redeemActivationCode(code);
        activationCodeInput.value = "";
        showFlash(t("settings.activationDone", "Browser Pro is active on this browser."), "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Activation failed", "warn");
      } finally {
        activateBtn.disabled = false;
      }
    });
    const upgradeBtn = el("button", "btn btn--secondary", t("settings.activationUpgrade", "Upgrade to Pro"));
    upgradeBtn.type = "button";
    upgradeBtn.addEventListener("click", () => {
      void openPricingPage();
    });
    activationCard.content.append(activationCodeInput, activateBtn, upgradeBtn);
  }
  accountSupport.append(activationCard.details);

  const companyCard = collapsibleCard(
    t("settings.companySync", "Company sync"),
    { badge: companySync?.companyId ? companySync.companyName || "Active" : "", open: false }
  );
  if (companySync?.companyId) {
    companyCard.content.append(el("p", "lead", t("settings.companyActive", "{company} is active. {count} company-managed words are applied automatically.", { company: companySync.companyName, count: companyTerms.length })));
    const joinedMeta = el("div", "status-line");
    joinedMeta.append(el("span", null, t("settings.joinedAs", "Joined as")));
    joinedMeta.append(el("strong", null, companySync.employeeEmail || "—"));
    companyCard.content.append(joinedMeta);
    if (companySync.lastSyncAt) {
      const syncedMeta = el("div", "status-line");
      syncedMeta.append(el("span", null, t("settings.lastSync", "Last sync")));
      syncedMeta.append(el("strong", null, new Date(companySync.lastSyncAt).toLocaleString()));
      companyCard.content.append(syncedMeta);
    }

    const syncBtn = el("button", "btn btn--primary", t("settings.syncNow", "Sync company words now"));
    syncBtn.type = "button";
    syncBtn.addEventListener("click", async () => {
      syncBtn.disabled = true;
      try {
        await syncCompanyTerms(true);
        showFlash(t("settings.syncDone", "Company words synced."), "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Sync failed", "warn");
      } finally {
        syncBtn.disabled = false;
      }
    });
    companyCard.content.append(syncBtn);

    const leaveBtn = el("button", "btn btn--secondary", t("settings.leaveCompany", "Leave company sync"));
    leaveBtn.type = "button";
    leaveBtn.addEventListener("click", async () => {
      await leaveCompany();
      showFlash(t("settings.left", "Company sync removed from this browser."), "ok");
      renderSettings();
    });
    companyCard.content.append(leaveBtn);
  } else {
    companyCard.content.append(el("p", "lead", t("settings.joinPrompt", "Join your company to receive admin-managed protected words. Your personal custom words still stay private to you and can be added separately.")));
    const joinCode = el("input", "words-input");
    joinCode.type = "text";
    joinCode.placeholder = t("settings.joinCode", "Company join code");
    const email = el("input", "words-input");
    email.type = "email";
    email.placeholder = t("settings.workEmail", "Work email");
    const joinBtn = el("button", "btn btn--primary", t("settings.joinCompany", "Join company"));
    joinBtn.type = "button";
    joinBtn.addEventListener("click", async () => {
      const code = joinCode.value.trim();
      const emailValue = email.value.trim();
      if (!code || !emailValue) {
        showFlash(t("settings.joinMissing", "Enter your join code and work email."), "warn");
        return;
      }
      joinBtn.disabled = true;
      try {
        await joinCompany(code, emailValue);
        showFlash(t("settings.joined", "Company sync is active."), "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Join failed", "warn");
      } finally {
        joinBtn.disabled = false;
      }
    });
    companyCard.content.append(joinCode, email, joinBtn);
  }
  accountSupport.append(companyCard.details);

  const feedbackCard = collapsibleCard(
    t("settings.feedback", "Feedback"),
    { open: false }
  );
  feedbackCard.content.append(el("p", "lead", t("settings.feedbackLead", "Tell us what worked or what broke. Please do not paste sensitive data.")));
  const feedbackMessage = document.createElement("textarea");
  feedbackMessage.className = "words-input";
  feedbackMessage.rows = 4;
  feedbackMessage.placeholder = host && /claude|gemini/.test(host)
    ? t("settings.feedbackPlaceholderHost", "Describe what happened on {host}...", { host })
    : t("settings.feedbackPlaceholder", "Describe what happened...");
  const feedbackEmail = el("input", "words-input");
  feedbackEmail.type = "email";
  feedbackEmail.placeholder = t("settings.feedbackEmail", "Email (optional)");
  const feedbackRow = el("div", "stack");
  const goodBtn = el("button", "btn btn--secondary", t("settings.feedbackGood", "Works well"));
  goodBtn.type = "button";
  goodBtn.addEventListener("click", () => {
    feedbackMessage.value = host
      ? t("settings.feedbackGoodFillHost", "Ledebe worked well on {host}.", { host })
      : t("settings.feedbackGoodFill", "Ledebe worked well for me.");
  });
  const issueBtn = el(
    "button",
    "btn btn--secondary",
    host?.includes("gemini")
      ? t("settings.feedbackGemini", "Report Gemini issue")
      : host?.includes("claude")
        ? t("settings.feedbackClaude", "Report Claude issue")
        : t("settings.feedbackIssue", "Report issue")
  );
  issueBtn.type = "button";
  issueBtn.addEventListener("click", () => {
    feedbackMessage.value = host
      ? t("settings.feedbackIssueFillHost", "I hit a problem on {host}: ", { host })
      : t("settings.feedbackIssueFill", "I hit a problem: ");
    feedbackMessage.focus();
  });
  feedbackRow.append(goodBtn, issueBtn);
  const sendFeedbackBtn = el("button", "btn btn--primary", t("settings.feedbackSend", "Send feedback"));
  sendFeedbackBtn.type = "button";
  sendFeedbackBtn.addEventListener("click", async () => {
    const message = feedbackMessage.value.trim();
    if (!message) {
      showFlash(t("settings.feedbackMissing", "Enter a short message first."), "warn");
      return;
    }
    sendFeedbackBtn.disabled = true;
    try {
      await submitFeedback({
        message,
        email: feedbackEmail.value.trim(),
        host,
        category: feedbackCategoryForHost(host)
      });
      feedbackMessage.value = "";
      feedbackEmail.value = "";
      showFlash(t("settings.feedbackSent", "Feedback sent. Thank you."), "ok");
    } catch (error) {
      showFlash(error instanceof Error ? error.message : t("settings.feedbackFailed", "Could not send feedback"), "warn");
    } finally {
      sendFeedbackBtn.disabled = false;
    }
  });
  feedbackCard.content.append(feedbackMessage, feedbackEmail, feedbackRow, sendFeedbackBtn);
  accountSupport.append(feedbackCard.details);
  body.append(accountSupport);

  const paused = host ? (settings.pausedHosts || []).includes(host) : false;
  const sessionPaused = host ? sessionPausedHosts.includes(host) : false;
  const protectionCard = collapsibleCard(
    t("settings.protectionControls", "Protection controls"),
    { open: true }
  );
  protectionCard.content.append(
    toggleRow("enabled", t("settings.protectionOn", "Protection on"), t("settings.protectionHint", "Master switch for detection and masking."), settings.enabled !== false),
    toggleRow("autoReplace", t("settings.replace", "Replace as I type"), t("settings.replaceHint", "Mask each value live, before send."), settings.autoReplace !== false),
    toggleRow("restoreResponses", t("settings.restore", "Reveal replies here"), t("settings.restoreHint", "Show the reply with real values in this panel."), settings.restoreResponses !== false),
    el("div", "section", t("settings.mode", "Protection style")),
    el("p", "lead", t("settings.modeLead", "Choose how broad Ledebe should be when it guesses what to protect."))
  );
  if (paused || sessionPaused) {
    protectionCard.content.append(el("p", "lead", t("settings.pausedHint", "Protection is currently paused on this site. Choosing Mild or Aggressive will turn it back on.")));
  }
  protectionCard.content.append(modePicker(settings));
  body.append(protectionCard.details);

  const siteActionsCard = collapsibleCard(
    t("settings.siteActions", "Site actions"),
    { open: true }
  );
  const sessionPauseBtn = el(
    "button",
    "btn btn--secondary",
    sessionPaused ? t("settings.resumeSession", "Resume this session") : t("settings.pauseSession", "Pause for this session")
  );
  sessionPauseBtn.type = "button";
  sessionPauseBtn.disabled = !host;
  sessionPauseBtn.addEventListener("click", async () => {
    const cur = await chrome.storage.session.get({ [SESSION_PAUSED_HOSTS_KEY]: [] });
    const set = new Set(cur[SESSION_PAUSED_HOSTS_KEY] || []);
    if (set.has(host)) set.delete(host); else set.add(host);
    await chrome.storage.session.set({ [SESSION_PAUSED_HOSTS_KEY]: Array.from(set) });
    await refreshState();
    renderSettings();
  });
  siteActionsCard.content.append(sessionPauseBtn);

  const pauseBtn = el("button", "btn btn--secondary", paused ? t("settings.resume", "Resume on this site") : t("settings.pause", "Pause on this site"));
  pauseBtn.type = "button";
  pauseBtn.disabled = !host;
  pauseBtn.addEventListener("click", async () => {
    const cur = await chrome.storage.sync.get(DEFAULTS);
    const set = new Set(cur.pausedHosts || []);
    if (set.has(host)) set.delete(host); else set.add(host);
    await chrome.storage.sync.set({ pausedHosts: Array.from(set) });
    renderSettings();
  });
  siteActionsCard.content.append(pauseBtn);

  const toggleSelectionBtn = el("button", "btn btn--secondary", t("field.protectSelection", "Protect selected text"));
  toggleSelectionBtn.type = "button";
  toggleSelectionBtn.addEventListener("click", () => act({ type: "PROTECT_SELECTION" }));
  const protectBtn = el("button", "btn btn--primary", t("settings.protectField", "Protect active field now"));
  protectBtn.type = "button";
  protectBtn.addEventListener("click", () => act({ type: "PROTECT_ACTIVE_FIELD", source: "panel" }));
  siteActionsCard.content.append(protectBtn, toggleSelectionBtn);
  body.append(siteActionsCard.details);

  // --- everything else, tucked away -----------------------------------------
  const adv = document.createElement("details");
  adv.className = "advanced";
  adv.open = advancedOpen;
  adv.addEventListener("toggle", () => { advancedOpen = adv.open; });
  const summary = document.createElement("summary");
  summary.textContent = t("settings.advanced", "Advanced settings");
  adv.append(summary);

  adv.append(toggleRow("scanOnPaste", t("settings.scanPaste", "Scan on paste"), t("settings.scanPasteHint", "Mask sensitive data you paste in."), settings.scanOnPaste !== false));
  adv.append(toggleRow("appendInstruction", t("settings.keepTokens", "Ask AI to keep placeholders"), t("settings.keepTokensHint", "Append a note on send so tokens stay intact."), settings.appendInstruction !== false));
  adv.append(toggleRow("persistMappings", t("settings.remember", "Remember across restarts"), t("settings.rememberHint", "Keep restoring older chats after the browser closes. Stays on this device."), settings.persistMappings !== false));

  adv.append(el("div", "section", t("settings.whatDetect", "What to detect")));
  adv.append(toggleRow("detectNames", t("settings.names", "Names"), t("settings.namesHint", "Two-or-more capitalised words (heuristic)."), settings.detectNames !== false));
  adv.append(toggleRow("detectNumbers", t("settings.numbers", "Numbers"), t("settings.numbersHint", "Any run of 3+ digits."), settings.detectNumbers !== false));
  adv.append(toggleRow("detectAddresses", t("settings.addresses", "Addresses"), t("settings.addressesHint", "Street addresses."), settings.detectAddresses !== false));
  adv.append(toggleRow("detectCodes", t("settings.codes", "Codes / IDs"), t("settings.codesHint", "Tokens mixing letters and digits."), settings.detectCodes !== false));
  adv.append(el("p", "lead", t("settings.alwaysDetected", "Emails, phone numbers, cards, SSNs, IPs and API keys are always detected.")));

  const clearBtn = el("button", "btn btn--secondary", t("settings.clear", "Clear saved data"));
  clearBtn.type = "button";
  clearBtn.addEventListener("click", async () => {
    await act({ type: "CLEAR_DATA" }); // clears only the active site's data
    clearBtn.textContent = t("settings.cleared", "Cleared");
    setTimeout(() => { clearBtn.textContent = t("settings.clear", "Clear saved data"); }, 1200);
  });
  adv.append(clearBtn);

  body.append(adv);
}

// ---- lifecycle -----------------------------------------------------------

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") refreshState();
  }, 800);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function applyStaticText() {
  const title = document.querySelector(".head strong");
  if (title) title.textContent = t("app.title", "Ledebe Protector");
  const privacy = document.getElementById("privacy-note");
  if (privacy) privacy.textContent = t("panel.privacy", "Your data never leaves your device.");
  document.querySelector('.tab[data-tab="home"]').textContent = t("tabs.home", "Home");
  document.querySelector('.tab[data-tab="words"]').textContent = t("tabs.words", "Custom words");
  document.querySelector('.tab[data-tab="field"]').textContent = t("tabs.field", "Protected words");
  document.querySelector('.tab[data-tab="settings"]').textContent = t("tabs.settings", "Settings");
}

function announceVisibility(visible) {
  void sendToTab({ type: "PANEL_VISIBLE", visible });
  void announceNativePanelVisibility(visible);
}

document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

document.addEventListener("visibilitychange", () => {
  const visible = document.visibilityState === "visible";
  announceVisibility(visible);
  if (visible) refreshState();
});
window.addEventListener("pagehide", () => announceVisibility(false));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CLOSE_SIDE_PANEL") {
    void announceVisibility(false);
    window.close();
    sendResponse?.({ ok: true });
    return true;
  }
  return false;
});

chrome.tabs.onActivated.addListener(() => refreshState());
chrome.tabs.onUpdated.addListener((_, info) => { if (info.status === "complete") refreshState(); });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (activeTab === "settings" || activeTab === "words")) render(true);
  if (area === "session" && changes[SESSION_PAUSED_HOSTS_KEY] && activeTab === "settings") render(true);
  if (area === "local" && (changes[COMPANY_STATE_STORAGE_KEY] || changes[COMPANY_TERMS_STORAGE_KEY] || changes[ACTIVATION_STATE_STORAGE_KEY])) {
    if (activeTab === "settings" || activeTab === "words") render(true);
  }
});

const logoUrl = chrome.runtime.getURL("ledebe-icon.png");
if (logoUrl) document.getElementById("logo").src = logoUrl;

applyStaticText();
announceVisibility(true);
refreshState();
startPolling();
