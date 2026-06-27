const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const LATEST_RESTORED_KEY = "ledebeLatestRestored";

const DEFAULTS = {
  enabled: true,
  autoReplace: true,
  scanOnPaste: true,
  restoreResponses: true,
  persistMappings: true,
  appendInstruction: true,
  detectNames: true,
  detectNumbers: true,
  detectAddresses: true,
  detectCodes: true,
  customTerms: [],
  personalTerms: [],
  pausedHosts: [],
  subscriptionPlan: "free"
};

const COMPANY_API_BASE = "https://m9ur273451.execute-api.us-east-2.amazonaws.com";
const COMPANY_TERMS_STORAGE_KEY = "ledebeCompanyTerms";
const COMPANY_STATE_STORAGE_KEY = "ledebeCompanyState";
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
let flashTimer = null;

const body = document.getElementById("body");
const $ = (sel, root = document) => root.querySelector(sel);

// ---- messaging -----------------------------------------------------------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
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

function copyButton(label, getText) {
  const btn = el("button", "btn btn--ghost", label);
  btn.type = "button";
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = label; }, 1200);
    } catch (error) { /* clipboard blocked */ }
  });
  return btn;
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

function effectivePlanFromData(settings, companySync) {
  return companySync?.companyId ? "team" : (settings.subscriptionPlan || "free");
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

// Small per-message copy button, like the one on ChatGPT's reply blocks.
function msgCopyButton(getTextOrString) {
  const btn = el("button", "msg__copy", "Copy");
  btn.type = "button";
  btn.title = "Copy this message";
  btn.addEventListener("click", async () => {
    const text = typeof getTextOrString === "function" ? getTextOrString() : getTextOrString;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = "Copy"; }, 1200);
    } catch (error) { /* clipboard blocked */ }
  });
  return btn;
}

// ---- render --------------------------------------------------------------

function renderNoPage() {
  $("#session-count").textContent = "Open an AI chat to begin";
  body.innerHTML = "";
  body.append(el("p", "empty", "Ledebe is active on AI chat pages. Open one (ChatGPT, Claude, Gemini…) and your protected values will appear here."));
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
  body.append(el("p", "lead", "Your chat with real values restored — shown only here. The page itself keeps the placeholders."));
  const turns = state.transcript || [];
  if (!turns.length) {
    if (state.latestRestored) {
      body.append(el("pre", "restored", state.latestRestored));
      body.append(copyButton("Copy restored reply", () => state.latestRestored));
    } else {
      body.append(el("p", "empty", "No restored content yet. Send a protected prompt and the chat will mirror here with your real values."));
    }
    return;
  }
  for (const turn of turns) {
    const msg = el("div", `msg msg--${turn.role === "assistant" ? "assistant" : "user"}`);
    msg.append(el("div", "msg__role", turn.role === "assistant" ? "Assistant" : "You"));
    for (const block of turn.blocks || []) {
      const blk = el("div", "msg__block" + (block.kind === "code" ? " is-code" : ""));
      const bhead = el("div", "msg__bhead");
      bhead.append(msgCopyButton(block.text)); // copies just this block
      blk.append(bhead, el("div", "msg__text", block.text));
      msg.append(blk);
    }
    body.append(msg);
  }
  body.append(copyButton("Copy whole transcript", () =>
    turns.map((t) => `${t.role === "assistant" ? "Assistant" : "You"}:\n${(t.blocks || []).map((b) => b.text).join("\n\n")}`).join("\n\n")));
}

async function renderWords() {
  const settings = await getStoredSettings();
  const { companySync, companyTerms } = await getCompanyState();
  const personalTerms = settings.personalTerms || [];
  const plan = effectivePlanFromData(settings, companySync);
  const limit = personalLimitForPlan(plan);

  body.innerHTML = "";
  body.append(el("p", "lead", "Always protect these words — names, project codes, client terms. Company-managed words apply automatically, and your own personal words are added on top."));

  const meta = el("div", "stack");
  meta.append(
    el("div", "pill", `Plan: ${plan}`),
    el("div", "pill", Number.isFinite(limit) ? `${personalTerms.length}/${limit} personal words` : `${personalTerms.length} personal words`)
  );
  body.append(meta);

  const add = el("div", "words-add");
  const input = el("input", "words-input");
  input.type = "text";
  input.placeholder = "Add a word or phrase…";
  const btn = el("button", "words-btn", "Add");
  btn.type = "button";
  const submit = async () => {
    const value = input.value.trim();
    if (!value) return;
    const allTerms = normalizeTerms([...companyTerms, ...personalTerms]);
    if (allTerms.some((term) => term.toLowerCase() === value.toLowerCase())) {
      showFlash("That word is already protected.", "warn");
      return;
    }
    if (Number.isFinite(limit) && personalTerms.length >= limit) {
      showFlash(`Your ${plan} plan allows ${limit} personal custom words.`, "warn");
      return;
    }
    const nextPersonalTerms = normalizeTerms([...personalTerms, value]);
    await chrome.storage.sync.set({
      personalTerms: nextPersonalTerms,
      customTerms: nextPersonalTerms
    });
    input.value = "";
    await refreshStateIfAvailable();
    showFlash("Custom word saved.", "ok");
    render(true);
  };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } });
  add.append(input, btn);
  body.append(add);

  if (companyTerms.length) {
    body.append(el("div", "section", `Company words (${companyTerms.length})`));
    body.append(el("p", "lead", companySync?.companyName
      ? `Managed by ${companySync.companyName}. These do not count against your personal-word limit.`
      : "Managed by your company admin."));
    for (const term of companyTerms) {
      body.append(row("protected", term, "company-managed", "Locked", () => {}));
    }
  }

  if (!personalTerms.length) {
    body.append(el("p", "empty", companyTerms.length ? "No personal custom words yet." : "No custom words yet."));
    return;
  }

  body.append(el("div", "section", `Personal words (${personalTerms.length})`));
  for (const term of personalTerms) {
    body.append(row("protected", term, "custom word", "Remove", async () => {
      const nextPersonalTerms = personalTerms.filter((item) => item.toLowerCase() !== term.toLowerCase());
      await chrome.storage.sync.set({
        personalTerms: nextPersonalTerms,
        customTerms: nextPersonalTerms
      });
      await refreshStateIfAvailable();
      showFlash("Custom word removed.", "ok");
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
      body.append(row("protected", item.value, meta, "Forget",
        () => act({ type: "FORGET_VALUE", value: item.value })));
    }
  }
  if (!exposed.length && !prot.length && !session.length) {
    body.append(el("p", "empty", "No sensitive data detected in this field."));
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
    await chrome.storage.sync.set({ [key]: input.checked });
  });
  wrap.append(span, input);
  return wrap;
}

async function renderSettings() {
  const settings = await getStoredSettings();
  const { companySync, companyTerms } = await getCompanyState();
  body.innerHTML = "";
  $("#session-count").textContent =
    `${state ? state.sessionCount : 0} value${(state && state.sessionCount === 1) ? "" : "s"} protected this session`;

  const host = state?.host;
  const line = el("div", "status-line");
  line.append(el("span", null, "Current site"));
  line.append(el("strong", null, host || "—"));
  body.append(line);

  const planLine = el("div", "status-line");
  const plan = effectivePlanFromData(settings, companySync);
  const limit = personalLimitForPlan(plan);
  planLine.append(el("span", null, "Subscription"));
  planLine.append(el("strong", null, Number.isFinite(limit) ? `${plan} · ${settings.personalTerms.length}/${limit} personal words` : `${plan} · unlimited personal words`));
  body.append(planLine);

  const companyCard = el("div", "card");
  companyCard.append(el("div", "section", "Company sync"));
  if (companySync?.companyId) {
    companyCard.append(el("p", "lead", `${companySync.companyName} is active. ${companyTerms.length} company-managed words are applied automatically.`));
    const joinedMeta = el("div", "status-line");
    joinedMeta.append(el("span", null, "Joined as"));
    joinedMeta.append(el("strong", null, companySync.employeeEmail || "—"));
    companyCard.append(joinedMeta);
    if (companySync.lastSyncAt) {
      const syncedMeta = el("div", "status-line");
      syncedMeta.append(el("span", null, "Last sync"));
      syncedMeta.append(el("strong", null, new Date(companySync.lastSyncAt).toLocaleString()));
      companyCard.append(syncedMeta);
    }

    const syncBtn = el("button", "btn btn--primary", "Sync company words now");
    syncBtn.type = "button";
    syncBtn.addEventListener("click", async () => {
      syncBtn.disabled = true;
      try {
        await syncCompanyTerms(true);
        showFlash("Company words synced.", "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Sync failed", "warn");
      } finally {
        syncBtn.disabled = false;
      }
    });
    companyCard.append(syncBtn);

    const leaveBtn = el("button", "btn btn--secondary", "Leave company sync");
    leaveBtn.type = "button";
    leaveBtn.addEventListener("click", async () => {
      await leaveCompany();
      showFlash("Company sync removed from this browser.", "ok");
      renderSettings();
    });
    companyCard.append(leaveBtn);
  } else {
    companyCard.append(el("p", "lead", "Join your company to receive admin-managed protected words. Your personal custom words still stay private to you and can be added separately."));
    const joinCode = el("input", "words-input");
    joinCode.type = "text";
    joinCode.placeholder = "Company join code";
    const email = el("input", "words-input");
    email.type = "email";
    email.placeholder = "Work email";
    const joinBtn = el("button", "btn btn--primary", "Join company");
    joinBtn.type = "button";
    joinBtn.addEventListener("click", async () => {
      const code = joinCode.value.trim();
      const emailValue = email.value.trim();
      if (!code || !emailValue) {
        showFlash("Enter your join code and work email.", "warn");
        return;
      }
      joinBtn.disabled = true;
      try {
        await joinCompany(code, emailValue);
        showFlash("Company sync is active.", "ok");
        renderSettings();
      } catch (error) {
        showFlash(error instanceof Error ? error.message : "Join failed", "warn");
      } finally {
        joinBtn.disabled = false;
      }
    });
    companyCard.append(joinCode, email, joinBtn);
  }
  body.append(companyCard);

  // --- the few settings most people touch -----------------------------------
  body.append(toggleRow("enabled", "Protection on", "Master switch for detection and masking.", settings.enabled !== false));
  body.append(toggleRow("autoReplace", "Replace as I type", "Mask each value live, before send.", settings.autoReplace !== false));
  body.append(toggleRow("restoreResponses", "Reveal replies here", "Show the reply with real values in this panel.", settings.restoreResponses !== false));

  const paused = host ? (settings.pausedHosts || []).includes(host) : false;
  const pauseBtn = el("button", "btn btn--secondary", paused ? "Resume on this site" : "Pause on this site");
  pauseBtn.type = "button";
  pauseBtn.disabled = !host;
  pauseBtn.addEventListener("click", async () => {
    const cur = await chrome.storage.sync.get(DEFAULTS);
    const set = new Set(cur.pausedHosts || []);
    if (set.has(host)) set.delete(host); else set.add(host);
    await chrome.storage.sync.set({ pausedHosts: Array.from(set) });
    renderSettings();
  });
  body.append(pauseBtn);

  const protectBtn = el("button", "btn btn--primary", "Protect active field now");
  protectBtn.type = "button";
  protectBtn.addEventListener("click", () => act({ type: "PROTECT_ACTIVE_FIELD" }));
  body.append(protectBtn);

  // --- everything else, tucked away -----------------------------------------
  const adv = document.createElement("details");
  adv.className = "advanced";
  adv.open = advancedOpen;
  adv.addEventListener("toggle", () => { advancedOpen = adv.open; });
  const summary = document.createElement("summary");
  summary.textContent = "Advanced settings";
  adv.append(summary);

  adv.append(toggleRow("scanOnPaste", "Scan on paste", "Mask sensitive data you paste in.", settings.scanOnPaste !== false));
  adv.append(toggleRow("appendInstruction", "Ask AI to keep placeholders", "Append a note on send so tokens stay intact.", settings.appendInstruction !== false));
  adv.append(toggleRow("persistMappings", "Remember across restarts", "Keep restoring older chats after the browser closes. Stays on this device.", settings.persistMappings !== false));

  adv.append(el("div", "section", "What to detect"));
  adv.append(toggleRow("detectNames", "Names", "Two-or-more capitalised words (heuristic).", settings.detectNames !== false));
  adv.append(toggleRow("detectNumbers", "Numbers", "Any run of 3+ digits.", settings.detectNumbers !== false));
  adv.append(toggleRow("detectAddresses", "Addresses", "Street addresses.", settings.detectAddresses !== false));
  adv.append(toggleRow("detectCodes", "Codes / IDs", "Tokens mixing letters and digits.", settings.detectCodes !== false));
  adv.append(el("p", "lead", "Emails, phone numbers, cards, SSNs, IPs and API keys are always detected."));

  const clearBtn = el("button", "btn btn--secondary", "Clear saved data");
  clearBtn.type = "button";
  clearBtn.addEventListener("click", async () => {
    await act({ type: "CLEAR_DATA" }); // clears only the active site's data
    clearBtn.textContent = "Cleared";
    setTimeout(() => { clearBtn.textContent = "Clear saved data"; }, 1200);
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

function announceVisibility(visible) {
  void sendToTab({ type: "PANEL_VISIBLE", visible });
}

document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

document.addEventListener("visibilitychange", () => {
  const visible = document.visibilityState === "visible";
  announceVisibility(visible);
  if (visible) refreshState();
});
window.addEventListener("pagehide", () => announceVisibility(false));

chrome.tabs.onActivated.addListener(() => refreshState());
chrome.tabs.onUpdated.addListener((_, info) => { if (info.status === "complete") refreshState(); });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (activeTab === "settings" || activeTab === "words")) render(true);
  if (area === "local" && (changes[COMPANY_STATE_STORAGE_KEY] || changes[COMPANY_TERMS_STORAGE_KEY])) {
    if (activeTab === "settings" || activeTab === "words") render(true);
  }
});

const logoUrl = chrome.runtime.getURL("ledebe-icon.png");
if (logoUrl) document.getElementById("logo").src = logoUrl;

announceVisibility(true);
refreshState();
startPolling();
