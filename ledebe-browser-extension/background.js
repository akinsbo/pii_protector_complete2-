const CONTEXT_MENU_ID = "ledebe-protect-selection";

async function ensureSessionStorageAccess() {
  if (!chrome.storage?.session?.setAccessLevel) {
    return;
  }

  await chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
  });
}

// The restored-answer tray can render three ways. The choice changes what the
// toolbar icon does, so it must be configured on the action + side panel.
//  - "sidepanel-icon"  : icon opens the native side panel (no popup)
//  - "sidepanel-popup" : icon opens the settings popup; popup opens the panel
//  - "inpage"          : icon opens the popup; tray is drawn in the page
let trayModeCurrent = "sidepanel-icon";

function extensionBadgeText() {
  const version = chrome.runtime.getManifest().version || "1.0.0";
  return version.replace(/\./g, "").slice(0, 4);
}

async function syncActionBadge() {
  try {
    await chrome.action.setBadgeBackgroundColor({ color: "#1e3a8a" });
    await chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
    await chrome.action.setBadgeText({ text: extensionBadgeText() });
  } catch (error) {
    // ignore
  }
}

async function applyTrayMode(trayMode) {
  trayModeCurrent = trayMode || "sidepanel-icon";
  try {
    // We open the panel ourselves in action.onClicked (more reliable than the
    // openPanelOnActionClick flag, which is inconsistent across Chrome builds).
    await chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false });
    // No popup in icon mode → action.onClicked fires and we open the panel.
    // Other modes keep the settings popup.
    await chrome.action.setPopup({ popup: trayModeCurrent === "sidepanel-icon" ? "" : "popup.html" });
  } catch (error) {
    // sidePanel API may be unavailable on older Chrome — fail soft.
  }
}

// Icon click (only fires when there's no popup, i.e. in sidepanel-icon mode).
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    return;
  }
  try {
    chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    // ignore
  }
});

async function syncTrayModeFromStorage() {
  const { trayMode } = await chrome.storage.sync.get({ trayMode: "sidepanel-icon" });
  await applyTrayMode(trayMode);
}

void ensureSessionStorageAccess();
void syncTrayModeFromStorage();
void syncActionBadge();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.trayMode) {
    void applyTrayMode(changes.trayMode.newValue);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSessionStorageAccess();
  await syncActionBadge();

  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Protect with Ledebe",
    contexts: ["selection", "editable"]
  });

  const existing = await chrome.storage.sync.get({
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
  });

  await chrome.storage.sync.set(existing);
  await applyTrayMode(existing.trayMode);
});

chrome.runtime.onStartup?.addListener(() => {
  void ensureSessionStorageAccess();
  void syncTrayModeFromStorage();
  void syncActionBadge();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "PROTECT_SELECTION" });
});

// Open the side panel when an in-page button asks for it. The click in the
// content script counts as the user gesture Chrome requires.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "OPEN_SIDE_PANEL" && sender.tab?.id) {
    try {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    } catch (error) {
      // sidePanel unavailable — ignore
    }
  }
});
