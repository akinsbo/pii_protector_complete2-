const CONTEXT_MENU_ID = "ledebe-protect-selection";

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Protect with Ledebe",
    contexts: ["selection", "editable"]
  });

  const existing = await chrome.storage.sync.get({
    enabled: true,
    safeSend: true,
    scanOnPaste: true,
    customTerms: [],
    pausedHosts: []
  });

  await chrome.storage.sync.set(existing);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "PROTECT_SELECTION" });
});
