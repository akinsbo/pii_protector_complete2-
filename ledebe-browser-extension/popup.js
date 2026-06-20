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

const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const LATEST_RESTORED_KEY = "ledebeLatestRestored";
const EXTENSION_VERSION = chrome.runtime.getManifest().version;

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

function renderSummary(summary = []) {
  const container = document.getElementById("finding-summary");
  container.innerHTML = "";

  for (const item of summary) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = item;
    container.appendChild(pill);
  }
}

async function refreshPageState() {
  document.getElementById("extension-version").textContent = `v${EXTENSION_VERSION}`;
  const pageState = await sendToActiveTab({ type: "GET_PAGE_STATE" });
  document.getElementById("current-host").textContent = pageState?.host || "This page";
  document.getElementById("finding-count").textContent = `${pageState?.activeFindings || 0} item${pageState?.activeFindings === 1 ? "" : "s"}`;
  renderSummary(pageState?.activeSummary || []);

  const settings = await chrome.storage.sync.get(defaults);
  document.getElementById("enabled-toggle").checked = Boolean(settings.enabled);
  document.getElementById("safesend-toggle").checked = Boolean(settings.safeSend);
  document.getElementById("paste-toggle").checked = Boolean(settings.scanOnPaste);
  document.getElementById("auto-protect-ai-toggle").checked = settings.autoProtectAiPrompts !== false;
  document.getElementById("restore-responses-toggle").checked = Boolean(settings.restoreResponses);
  document.getElementById("reveal-mode-select").value = settings.revealMode || "panel";
  document.getElementById("tray-mode-select").value = settings.trayMode || "sidepanel-icon";
  document.getElementById("auto-open-restored-toggle").checked = settings.autoOpenRestoredAnswers !== false;
  document.getElementById("persist-toggle").checked = settings.persistMappings !== false;

  // The tray-type + open-tray controls only matter when the reveal style is the tray.
  const isTray = (settings.revealMode || "panel") === "panel";
  document.getElementById("tray-mode-row").style.display = isTray ? "" : "none";
  document.getElementById("auto-open-restored-row").style.display =
    isTray && settings.trayMode !== "inpage" ? "" : "none";
  document.getElementById("open-tray-btn").style.display =
    isTray && settings.trayMode !== "inpage" ? "" : "none";

  const host = pageState?.host;
  const paused = host ? settings.pausedHosts.includes(host) : false;
  const pauseBtn = document.getElementById("pause-btn");
  pauseBtn.textContent = paused ? "Resume on this site" : "Pause on this site";
}

async function updateSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  await refreshPageState();
}

document.getElementById("enabled-toggle").addEventListener("change", async (event) => {
  await updateSetting("enabled", event.target.checked);
});

document.getElementById("safesend-toggle").addEventListener("change", async (event) => {
  await updateSetting("safeSend", event.target.checked);
});

document.getElementById("paste-toggle").addEventListener("change", async (event) => {
  await updateSetting("scanOnPaste", event.target.checked);
});

document.getElementById("auto-protect-ai-toggle").addEventListener("change", async (event) => {
  await updateSetting("autoProtectAiPrompts", event.target.checked);
});

document.getElementById("restore-responses-toggle").addEventListener("change", async (event) => {
  await updateSetting("restoreResponses", event.target.checked);
});

document.getElementById("reveal-mode-select").addEventListener("change", async (event) => {
  await updateSetting("revealMode", event.target.value);
});

document.getElementById("tray-mode-select").addEventListener("change", async (event) => {
  await updateSetting("trayMode", event.target.value);
});

document.getElementById("auto-open-restored-toggle").addEventListener("change", async (event) => {
  await updateSetting("autoOpenRestoredAnswers", event.target.checked);
});

document.getElementById("persist-toggle").addEventListener("change", async (event) => {
  await updateSetting("persistMappings", event.target.checked);
});

document.getElementById("clear-data-btn").addEventListener("click", async () => {
  try { await chrome.storage.local.remove(PLACEHOLDER_STORAGE_KEY); } catch (e) { /* ignore */ }
  try { await chrome.storage.session.remove([PLACEHOLDER_STORAGE_KEY, LATEST_RESTORED_KEY]); } catch (e) { /* ignore */ }
  const btn = document.getElementById("clear-data-btn");
  const original = btn.textContent;
  btn.textContent = "Cleared";
  setTimeout(() => { btn.textContent = original; }, 1200);
});

document.getElementById("open-tray-btn").addEventListener("click", async () => {
  // Must run inside the click gesture for Chrome to allow opening the panel.
  try {
    const tab = await getActiveTab();
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  } catch (error) {
    // sidePanel unavailable — ignore
  }
});

document.getElementById("protect-btn").addEventListener("click", async () => {
  await sendToActiveTab({ type: "PROTECT_ACTIVE_FIELD" });
  await refreshPageState();
});

document.getElementById("rescan-btn").addEventListener("click", async () => {
  await sendToActiveTab({ type: "RESCAN_ACTIVE_FIELD" });
  await refreshPageState();
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
  await refreshPageState();
});

refreshPageState();
