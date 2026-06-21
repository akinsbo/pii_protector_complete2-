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
  customTerms: [],
  pausedHosts: []
};

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
      title: "Protect with Ledebe",
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "PROTECT_ACTIVE_FIELD" });
    // A context-menu click is a valid gesture — open the panel too.
    try { chrome.sidePanel.open({ tabId: tab.id }); } catch (error) { /* ignore */ }
  }
});

// In-page Ledebe icons ask to open the native panel. Chrome usually rejects a
// programmatic open outside a toolbar/context-menu gesture; we try anyway and
// report success so the content script can fall back to its overlay if not.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OPEN_SIDE_PANEL" && sender.tab?.id) {
    (async () => {
      try {
        await chrome.sidePanel.open({ tabId: sender.tab.id });
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false });
      }
    })();
    return true; // async response
  }
  return false;
});
