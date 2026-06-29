// Ledebe Browser Protector — service worker.
// Minimal: keep the session-storage map readable from content scripts, expose a
// right-click "Protect with Ledebe", and seed default settings on install.

const CONTEXT_MENU_ID = "ledebe-protect-selection";

const DEFAULT_SETTINGS = {
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

const nativePanelVisibility = new Map();

async function ensureSessionAccess() {
  try {
    await chrome.storage.session?.setAccessLevel?.({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
    });
  } catch (error) {
    /* older Chrome — ignore */
  }
}

function createContextMenu() {
  try {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Toggle protection with Ledebe",
      contexts: ["selection", "editable"]
    });
  } catch (error) {
    /* already exists — ignore */
  }
}

// Clicking the toolbar icon opens the native side panel (a real viewport push).
// This is a genuine user gesture, which Chrome requires for sidePanel.open.
async function enablePanelOnIconClick() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    /* older Chrome without sidePanel — ignore */
  }
}

void ensureSessionAccess();
void enablePanelOnIconClick();

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSessionAccess();
  await enablePanelOnIconClick();
  createContextMenu();
  const existing = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...existing });
});

chrome.runtime.onStartup?.addListener(() => {
  void ensureSessionAccess();
  void enablePanelOnIconClick();
});

// Backup for the toolbar icon: if setPanelBehavior didn't take effect, this
// fires on click (a valid gesture) and opens the native panel directly. When
// openPanelOnActionClick is active Chrome opens it itself and this won't fire.
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    try { chrome.sidePanel.open({ tabId: tab.id }); } catch (error) { /* ignore */ }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_SELECTION_PROTECTION",
      selectedText: info.selectionText || ""
    });
    // A context-menu click is a valid gesture — open the panel too.
    try { chrome.sidePanel.open({ tabId: tab.id }); } catch (error) { /* ignore */ }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SIDE_PANEL_VISIBILITY") {
    const tabId = Number(message.tabId);
    if (Number.isInteger(tabId)) nativePanelVisibility.set(tabId, Boolean(message.visible));
    sendResponse?.({ ok: true });
    return true;
  }

  if (message?.type === "TOGGLE_SIDE_PANEL" && sender.tab?.id) {
    (async () => {
      try {
        if (nativePanelVisibility.get(sender.tab.id)) {
          await chrome.runtime.sendMessage({ type: "CLOSE_SIDE_PANEL", tabId: sender.tab.id });
          sendResponse({ ok: true, open: false, native: true });
          return;
        }
        await chrome.sidePanel.open({ tabId: sender.tab.id });
        sendResponse({ ok: true, open: true, native: true });
      } catch (error) {
        sendResponse({ ok: false, native: true });
      }
    })();
    return true; // async response
  }
  return false;
});
