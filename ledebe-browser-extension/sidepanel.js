const LATEST_RESTORED_KEY = "ledebeLatestRestored";
const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

const defaults = {
  enabled: true,
  safeSend: true,
  scanOnPaste: true,
  autoProtectAiPrompts: true,
  customTerms: [],
  pausedHosts: [],
  restoreResponses: true,
  revealMode: "panel",
  trayMode: "sidepanel-icon",
  autoOpenRestoredAnswers: true,
  persistMappings: true
};

const EMPTY_TEXT =
  "No restored answer yet. Protect a prompt, send it, and the AI's reply will appear here with your real values restored.";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return null;
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    return null;
  }
}

function renderRestored(entry) {
  const body = document.getElementById("restored-body");
  const host = document.getElementById("restored-host");
  const copyBtn = document.getElementById("copy-restored");

  const warning = document.getElementById("restored-warning");
  if (entry && typeof entry.text === "string" && entry.text.trim()) {
    body.textContent = entry.text;
    body.classList.remove("is-empty");
    host.textContent = entry.host || "—";
    copyBtn.disabled = false;
    if (warning) warning.hidden = !entry.text.includes("[LDB_");
  } else {
    body.textContent = EMPTY_TEXT;
    body.classList.add("is-empty");
    host.textContent = "—";
    copyBtn.disabled = true;
    if (warning) warning.hidden = true;
  }
}

async function loadLatestRestored() {
  try {
    const stored = await chrome.storage.session.get(LATEST_RESTORED_KEY);
    renderRestored(stored[LATEST_RESTORED_KEY]);
  } catch (error) {
    renderRestored(null);
  }
}

async function refreshSettings() {
  document.getElementById("extension-version").textContent = `v${EXTENSION_VERSION}`;
  const settings = await chrome.storage.sync.get(defaults);
  document.getElementById("enabled-toggle").checked = Boolean(settings.enabled);
  document.getElementById("auto-protect-ai-toggle").checked = settings.autoProtectAiPrompts !== false;
  document.getElementById("restore-responses-toggle").checked = Boolean(settings.restoreResponses);
  document.getElementById("reveal-mode-select").value = settings.revealMode || "panel";
  document.getElementById("tray-mode-select").value = settings.trayMode || "sidepanel-icon";
  document.getElementById("auto-open-restored-toggle").checked = settings.autoOpenRestoredAnswers !== false;
  document.getElementById("persist-toggle").checked = settings.persistMappings !== false;
  const isTray = (settings.revealMode || "panel") === "panel";
  document.getElementById("auto-open-restored-row").style.display =
    isTray && settings.trayMode !== "inpage" ? "" : "none";

  const pageState = await sendToActiveTab({ type: "GET_PAGE_STATE" });
  document.getElementById("current-host").textContent = pageState?.host || "This page";
  document.getElementById("finding-count").textContent =
    `${pageState?.activeFindings || 0} item${pageState?.activeFindings === 1 ? "" : "s"}`;

  const host = pageState?.host;
  const paused = host ? settings.pausedHosts.includes(host) : false;
  document.getElementById("pause-btn").textContent = paused ? "Resume on this site" : "Pause on this site";
}

async function updateSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  await refreshSettings();
}

document.getElementById("enabled-toggle").addEventListener("change", (event) => {
  updateSetting("enabled", event.target.checked);
});
document.getElementById("auto-protect-ai-toggle").addEventListener("change", (event) => {
  updateSetting("autoProtectAiPrompts", event.target.checked);
});
document.getElementById("restore-responses-toggle").addEventListener("change", (event) => {
  updateSetting("restoreResponses", event.target.checked);
});
document.getElementById("reveal-mode-select").addEventListener("change", (event) => {
  updateSetting("revealMode", event.target.value);
});
document.getElementById("tray-mode-select").addEventListener("change", (event) => {
  updateSetting("trayMode", event.target.value);
});
document.getElementById("auto-open-restored-toggle").addEventListener("change", (event) => {
  updateSetting("autoOpenRestoredAnswers", event.target.checked);
});
document.getElementById("persist-toggle").addEventListener("change", (event) => {
  updateSetting("persistMappings", event.target.checked);
});

document.getElementById("clear-data-btn").addEventListener("click", async () => {
  // Wipe the token→value mapping from both stores and the latest restored answer.
  try { await chrome.storage.local.remove(PLACEHOLDER_STORAGE_KEY); } catch (e) { /* ignore */ }
  try { await chrome.storage.session.remove([PLACEHOLDER_STORAGE_KEY, LATEST_RESTORED_KEY]); } catch (e) { /* ignore */ }
  renderRestored(null);
  const btn = document.getElementById("clear-data-btn");
  const original = btn.textContent;
  btn.textContent = "Cleared";
  setTimeout(() => { btn.textContent = original; }, 1200);
});

document.getElementById("protect-btn").addEventListener("click", async () => {
  await sendToActiveTab({ type: "PROTECT_ACTIVE_FIELD" });
  await refreshSettings();
});

document.getElementById("pause-btn").addEventListener("click", async () => {
  const settings = await chrome.storage.sync.get(defaults);
  const pageState = await sendToActiveTab({ type: "GET_PAGE_STATE" });
  const host = pageState?.host;
  if (!host) {
    return;
  }
  const pausedHosts = new Set(settings.pausedHosts);
  if (pausedHosts.has(host)) {
    pausedHosts.delete(host);
  } else {
    pausedHosts.add(host);
  }
  await chrome.storage.sync.set({ pausedHosts: Array.from(pausedHosts) });
  await refreshSettings();
});

document.getElementById("copy-restored").addEventListener("click", async () => {
  const text = document.getElementById("restored-body").textContent || "";
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copy-restored");
    const original = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = original; }, 1200);
  } catch (error) {
    // clipboard blocked — ignore
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes[LATEST_RESTORED_KEY]) {
    renderRestored(changes[LATEST_RESTORED_KEY].newValue);
  }
  if (area === "sync") {
    refreshSettings();
  }
});

loadLatestRestored();
refreshSettings();
