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

const $ = (id) => document.getElementById(id);

function flash(message) {
  const el = $("status");
  el.textContent = message;
  setTimeout(() => { el.textContent = ""; }, 1500);
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToTab(message) {
  const tab = await activeTab();
  if (!tab?.id) return null;
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    return null;
  }
}

async function refresh() {
  $("extension-version").textContent = `v${chrome.runtime.getManifest().version}`;
  const settings = await chrome.storage.sync.get(DEFAULTS);

  $("enabled-toggle").checked = settings.enabled !== false;
  $("auto-replace-toggle").checked = settings.autoReplace !== false;
  $("paste-toggle").checked = settings.scanOnPaste !== false;
  $("append-instruction-toggle").checked = settings.appendInstruction !== false;
  $("restore-responses-toggle").checked = settings.restoreResponses !== false;
  $("persist-toggle").checked = settings.persistMappings !== false;
  $("custom-terms").value = (settings.customTerms || []).join("\n");

  const state = await sendToTab({ type: "GET_PAGE_STATE" });
  $("current-host").textContent = state?.host || "This page";
  $("finding-count").textContent = state
    ? `${state.protectedCount} protected · ${state.exposed} exposed`
    : "—";

  const host = state?.host;
  const paused = host ? (settings.pausedHosts || []).includes(host) : false;
  $("pause-btn").textContent = paused ? "Resume on this site" : "Pause on this site";
}

async function setSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  await refresh();
}

$("enabled-toggle").addEventListener("change", (e) => setSetting("enabled", e.target.checked));
$("auto-replace-toggle").addEventListener("change", (e) => setSetting("autoReplace", e.target.checked));
$("paste-toggle").addEventListener("change", (e) => setSetting("scanOnPaste", e.target.checked));
$("append-instruction-toggle").addEventListener("change", (e) => setSetting("appendInstruction", e.target.checked));
$("restore-responses-toggle").addEventListener("change", (e) => setSetting("restoreResponses", e.target.checked));
$("persist-toggle").addEventListener("change", (e) => setSetting("persistMappings", e.target.checked));

$("save-terms-btn").addEventListener("click", async () => {
  const terms = $("custom-terms").value
    .split(/[\n,]/)
    .map((term) => term.trim())
    .filter(Boolean);
  await chrome.storage.sync.set({ customTerms: terms });
  flash("Saved.");
});

$("protect-btn").addEventListener("click", async () => {
  await sendToTab({ type: "PROTECT_ACTIVE_FIELD" });
  await refresh();
});

$("open-panel-btn").addEventListener("click", async () => {
  await sendToTab({ type: "OPEN_PANEL" });
  window.close();
});

$("pause-btn").addEventListener("click", async () => {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  const state = await sendToTab({ type: "GET_PAGE_STATE" });
  const host = state?.host;
  if (!host) return;
  const paused = new Set(settings.pausedHosts || []);
  if (paused.has(host)) paused.delete(host);
  else paused.add(host);
  await chrome.storage.sync.set({ pausedHosts: Array.from(paused) });
  await refresh();
});

$("clear-data-btn").addEventListener("click", async () => {
  try { await chrome.storage.local.remove(PLACEHOLDER_STORAGE_KEY); } catch (e) { /* ignore */ }
  try { await chrome.storage.session.remove([PLACEHOLDER_STORAGE_KEY, LATEST_RESTORED_KEY]); } catch (e) { /* ignore */ }
  flash("Cleared saved data.");
});

refresh();
