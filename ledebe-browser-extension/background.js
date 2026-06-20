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

void ensureSessionAccess();

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSessionAccess();
  createContextMenu();
  const existing = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...existing });
});

chrome.runtime.onStartup?.addListener(() => {
  void ensureSessionAccess();
});

// Toolbar icon opens the popup (manifest default_popup), so no action handler
// is needed here.

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "PROTECT_ACTIVE_FIELD" });
  }
});
