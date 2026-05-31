const defaults = {
  enabled: true,
  safeSend: true,
  scanOnPaste: true,
  customTerms: [],
  pausedHosts: []
};

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
  const pageState = await sendToActiveTab({ type: "GET_PAGE_STATE" });
  document.getElementById("current-host").textContent = pageState?.host || "This page";
  document.getElementById("finding-count").textContent = `${pageState?.activeFindings || 0} item${pageState?.activeFindings === 1 ? "" : "s"}`;
  renderSummary(pageState?.activeSummary || []);

  const settings = await chrome.storage.sync.get(defaults);
  document.getElementById("enabled-toggle").checked = Boolean(settings.enabled);
  document.getElementById("safesend-toggle").checked = Boolean(settings.safeSend);
  document.getElementById("paste-toggle").checked = Boolean(settings.scanOnPaste);

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
