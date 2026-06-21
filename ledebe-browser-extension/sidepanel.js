const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const LATEST_RESTORED_KEY = "ledebeLatestRestored";

const DEFAULTS = {
  enabled: true,
  autoReplace: true,
  scanOnPaste: true,
  restoreResponses: true,
  persistMappings: true,
  appendInstruction: true,
  customTerms: [],
  pausedHosts: []
};

let activeTab = "home";
let state = null;     // latest GET_STATE snapshot
let pollTimer = null;

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
    render();
  } else if (!state) {
    renderNoPage();
  }
}

async function act(message) {
  const next = await sendToTab(message);
  if (next) { state = next; render(); }
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

// ---- render --------------------------------------------------------------

function renderNoPage() {
  $("#session-count").textContent = "Open an AI chat to begin";
  body.innerHTML = "";
  body.append(el("p", "empty", "Ledebe is active on AI chat pages. Open one (ChatGPT, Claude, Gemini…) and your protected values will appear here."));
}

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
  render();
}

function render() {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === activeTab));
  if (!state) { renderNoPage(); return; }
  $("#session-count").textContent =
    `${state.sessionCount} value${state.sessionCount === 1 ? "" : "s"} protected this session`;
  body.innerHTML = "";
  if (activeTab === "home") renderHome();
  else if (activeTab === "words") renderWords();
  else if (activeTab === "field") renderField();
  else renderSettings();
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
    msg.append(el("div", "msg__text", turn.text));
    body.append(msg);
  }
  body.append(copyButton("Copy restored transcript", () =>
    turns.map((t) => `${t.role === "assistant" ? "Assistant" : "You"}:\n${t.text}`).join("\n\n")));
}

function renderWords() {
  body.append(el("p", "lead", "Always protect these words — names, project codes, client terms. They get masked just like detected PII."));
  const add = el("div", "words-add");
  const input = el("input", "words-input");
  input.type = "text";
  input.placeholder = "Add a word or phrase…";
  const btn = el("button", "words-btn", "Add");
  btn.type = "button";
  const submit = () => { const v = input.value.trim(); if (v) act({ type: "ADD_TERM", term: v }); };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  add.append(input, btn);
  body.append(add);

  const terms = state.customTerms || [];
  if (!terms.length) { body.append(el("p", "empty", "No custom words yet.")); return; }
  body.append(el("div", "section", `Custom words (${terms.length})`));
  for (const term of terms) {
    body.append(row("protected", term, "custom word", "Remove", () => act({ type: "REMOVE_TERM", term })));
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
  const settings = await chrome.storage.sync.get(DEFAULTS);
  body.innerHTML = "";
  $("#session-count").textContent =
    `${state ? state.sessionCount : 0} value${(state && state.sessionCount === 1) ? "" : "s"} protected this session`;

  const host = state?.host;
  const line = el("div", "status-line");
  line.append(el("span", null, "Current site"));
  line.append(el("strong", null, host || "—"));
  body.append(line);

  body.append(toggleRow("enabled", "Protection on", "Master switch for detection and masking.", settings.enabled !== false));
  body.append(toggleRow("autoReplace", "Replace as I type", "Mask each value live, before send.", settings.autoReplace !== false));
  body.append(toggleRow("scanOnPaste", "Scan on paste", "Mask sensitive data you paste in.", settings.scanOnPaste !== false));
  body.append(toggleRow("appendInstruction", "Ask AI to keep placeholders", "Append a note on send so tokens stay intact.", settings.appendInstruction !== false));
  body.append(toggleRow("restoreResponses", "Reveal replies here", "Show the reply with real values in this panel.", settings.restoreResponses !== false));
  body.append(toggleRow("persistMappings", "Remember across restarts", "Keep restoring older chats after the browser closes. Stays on this device.", settings.persistMappings !== false));

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

  const clearBtn = el("button", "btn btn--secondary", "Clear saved data");
  clearBtn.type = "button";
  clearBtn.addEventListener("click", async () => {
    try { await chrome.storage.local.remove(PLACEHOLDER_STORAGE_KEY); } catch (e) { /* ignore */ }
    try { await chrome.storage.session.remove([PLACEHOLDER_STORAGE_KEY, LATEST_RESTORED_KEY]); } catch (e) { /* ignore */ }
    clearBtn.textContent = "Cleared";
    setTimeout(() => { clearBtn.textContent = "Clear saved data"; }, 1200);
  });
  body.append(clearBtn);
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
  if (area === "sync" && activeTab === "settings") renderSettings();
});

const logoUrl = chrome.runtime.getURL("ledebe-icon.png");
if (logoUrl) document.getElementById("logo").src = logoUrl;

announceVisibility(true);
refreshState();
startPolling();
