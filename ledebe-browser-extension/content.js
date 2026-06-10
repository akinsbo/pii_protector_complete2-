const LEDEBE_DEFAULT_SETTINGS = {
  enabled: true,
  safeSend: true,
  scanOnPaste: true,
  customTerms: [],
  pausedHosts: []
};

let ledebeSettings = { ...LEDEBE_DEFAULT_SETTINGS };
let activeEditable = null;
let activeFindings = [];
let launcherRoot = null;
let assistantPanel = null;
let assistantOpen = false;
let launcherHideTimer = null;
let launcherPinned = false;
let launcherAnchor = null;
let panelManualPosition = null;
let panelDragState = null;
let selectionButton = null;
let warnedEditable = null;
let warnedAt = 0;
let lastTextCueRect = null;
const restoreSnapshots = new WeakMap();
let pendingRestoreState = null;
const sessionPlaceholderMap = new Map();
const PLACEHOLDER_STORAGE_KEY = "ledebeSessionPlaceholderMap";
const HIGHLIGHT_SUPPORTED = typeof globalThis.CSS !== "undefined" && Boolean(globalThis.CSS.highlights) && typeof globalThis.Highlight !== "undefined";

function hasValidExtensionContext() {
  try {
    return Boolean(globalThis.chrome?.runtime?.id);
  } catch (error) {
    return false;
  }
}

function safeRuntimeGetUrl(path) {
  try {
    if (!hasValidExtensionContext()) {
      return "";
    }
    return chrome.runtime.getURL(path);
  } catch (error) {
    return "";
  }
}

async function safeStorageGet(defaults) {
  try {
    if (!hasValidExtensionContext()) {
      return defaults;
    }
    return await chrome.storage.sync.get(defaults);
  } catch (error) {
    return defaults;
  }
}

async function safeStorageSet(value) {
  try {
    if (!hasValidExtensionContext()) {
      return false;
    }
    await chrome.storage.sync.set(value);
    return true;
  } catch (error) {
    return false;
  }
}

async function safeSessionStorageGet(key) {
  try {
    if (!hasValidExtensionContext()) {
      return {};
    }
    if (chrome.storage?.local) {
      return await chrome.storage.local.get(key);
    }
    if (chrome.storage?.session) {
      return await chrome.storage.session.get(key);
    }
    return {};
  } catch (error) {
    return {};
  }
}

async function safeSessionStorageSet(value) {
  try {
    if (!hasValidExtensionContext()) {
      return false;
    }
    if (chrome.storage?.local) {
      await chrome.storage.local.set(value);
      return true;
    }
    if (chrome.storage?.session) {
      await chrome.storage.session.set(value);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function placeholderMappingMissingForText(value) {
  return value.includes("[LDB_") && sessionPlaceholderMap.size === 0;
}

function hasKnownPlaceholdersInText(value) {
  if (!value.includes("[LDB_") || !sessionPlaceholderMap.size) {
    return false;
  }

  for (const token of sessionPlaceholderMap.keys()) {
    if (value.includes(token)) {
      return true;
    }
  }

  return false;
}

function showMissingPlaceholderMappingToast() {
  toast("Protected placeholders found, but Ledebe has no saved mappings for them in this browser.");
}

function canRestoreFromMappings(element) {
  if (!element) {
    return false;
  }

  const value = getEditableText(element);
  return hasKnownPlaceholdersInText(value);
}

function shouldHandlePlaceholderRestore(element) {
  if (!element) {
    return false;
  }

  return getEditableText(element).includes("[LDB_");
}

function restoreFromMappings(element) {
  const currentText = getEditableText(element);
  const restoredPlaceholders = restoreKnownPlaceholdersInText(currentText);
  if (restoredPlaceholders.restoredCount > 0) {
    setEditableText(element, restoredPlaceholders.restored);
    analyzeElement(element);
    toast(`Restored ${restoredPlaceholders.restoredCount} protected item${restoredPlaceholders.restoredCount === 1 ? "" : "s"} in this text.`);
    return true;
  }

  if (placeholderMappingMissingForText(currentText)) {
    showMissingPlaceholderMappingToast();
    return true;
  }

  return false;
}

function getHost() {
  return window.location.hostname;
}

function isGoogleDocsHost() {
  return getHost().includes("docs.google.com");
}

function isPausedForHost() {
  return ledebeSettings.pausedHosts.includes(getHost());
}

function isGoogleDocsEditorSurface(node) {
  if (!isGoogleDocsHost() || !node || !(node instanceof HTMLElement)) {
    return false;
  }

  if (node.matches("iframe.docs-texteventtarget-iframe, .docs-texteventtarget-iframe")) {
    return true;
  }

  if (node.matches(".kix-appview-editor, .kix-page, .kix-canvas-tile-content")) {
    return true;
  }

  if (node instanceof HTMLBodyElement) {
    const frameElement = node.ownerDocument.defaultView?.frameElement;
    if (frameElement instanceof HTMLIFrameElement && frameElement.classList.contains("docs-texteventtarget-iframe")) {
      return true;
    }
  }

  return Boolean(node.closest(".kix-appview-editor"));
}

function isEditableElement(node) {
  if (!node || !(node instanceof HTMLElement)) {
    return false;
  }

  if (isGoogleDocsEditorSurface(node)) {
    return true;
  }

  if (node instanceof HTMLTextAreaElement) {
    return true;
  }

  if (node instanceof HTMLInputElement) {
    const allowed = ["text", "search", "email", "url", "tel", "password"];
    return allowed.includes(node.type || "text");
  }

  return node.isContentEditable;
}

function isInsideLedebeUi(node) {
  return Boolean(
    node instanceof Node &&
    ((launcherRoot && launcherRoot.contains(node)) || (assistantPanel && assistantPanel.contains(node)))
  );
}

function getEditableRoot(node) {
  if (!(node instanceof HTMLElement)) {
    return null;
  }

  if (isGoogleDocsEditorSurface(node) || node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
    return node;
  }

  if (!node.isContentEditable) {
    return null;
  }

  let root = node;
  let current = node.parentElement;
  while (current && current !== document.body) {
    if (isInsideLedebeUi(current)) {
      break;
    }

    if (!current.isContentEditable) {
      break;
    }

    root = current;
    current = current.parentElement;
  }

  return root;
}

function resolveEditableElement(node) {
  let current = null;

  if (node instanceof HTMLElement) {
    current = node;
  } else if (node instanceof Node && node.parentElement) {
    current = node.parentElement;
  }

  while (current) {
    if (isInsideLedebeUi(current)) {
      return null;
    }
    if (isEditableElement(current)) {
      return getEditableRoot(current) || current;
    }
    current = current.parentElement;
  }

  return null;
}

function getSelectionEditableTarget(selection) {
  if (!selection) {
    return null;
  }

  const candidates = [
    selection.anchorNode,
    selection.focusNode,
    selection.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : null,
    document.activeElement
  ];

  for (const candidate of candidates) {
    const resolved = resolveEditableElement(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function getSelectionRect(selection) {
  if (!selection || !selection.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const directRect = range.getBoundingClientRect();
  if (directRect && (directRect.width || directRect.height)) {
    return directRect;
  }

  const clientRects = Array.from(range.getClientRects());
  if (clientRects.length) {
    return clientRects[clientRects.length - 1];
  }

  const target = getSelectionEditableTarget(selection);
  return target?.getBoundingClientRect() || null;
}

function rememberTextCueRect(rect) {
  if (!rect || (!rect.width && !rect.height)) {
    return;
  }

  lastTextCueRect = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height
  };
}

function getCaretOrSelectionRect(element = activeEditable) {
  const selection = document.getSelection();
  const selectionTarget = getSelectionEditableTarget(selection);
  if (selection && selection.rangeCount && selectionTarget && (!element || selectionTarget === element)) {
    const rect = getSelectionRect(selection);
    if (rect && (rect.width || rect.height)) {
      rememberTextCueRect(rect);
      return rect;
    }
  }

  if (lastTextCueRect) {
    return lastTextCueRect;
  }

  return element?.getBoundingClientRect() || null;
}

function getSelectionButtonPosition(selection, target) {
  const rect = getSelectionRect(selection) || target?.getBoundingClientRect();
  if (!rect) {
    return null;
  }

  const host = getHost();
  if (host.includes("mail.google.com") || host.includes("docs.google.com")) {
    return {
      x: rect.right - Math.min(Math.max(rect.width * 0.2, 12), 24),
      y: rect.top + 4
    };
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top
  };
}

function getAnchorElementForLauncher(element) {
  if (!(element instanceof HTMLElement)) {
    return element;
  }

  const host = getHost();

  if (isGoogleDocsEditorSurface(element)) {
    const docsEditor = document.querySelector(".kix-appview-editor");
    if (docsEditor instanceof HTMLElement) {
      return docsEditor;
    }
    return element;
  }

  if (host.includes("claude.ai") || host.includes("anthropic.com")) {
    const claudeContainer =
      element.closest('[role="textbox"]')?.parentElement?.parentElement ||
      element.closest("form") ||
      element.closest('[class*="ProseMirror"]') ||
      element.closest('[class*="composer"]');

    if (claudeContainer instanceof HTMLElement) {
      return claudeContainer;
    }
  }

  if (host.includes("mail.google.com")) {
    const gmailContainer =
      element.closest('[role="textbox"]') ||
      element.closest('[contenteditable="true"]') ||
      element;

    if (gmailContainer instanceof HTMLElement) {
      return gmailContainer;
    }
  }

  let best = element;
  let current = element;
  while (current && current !== document.body) {
    const rect = current.getBoundingClientRect();
    if (rect.width >= 220 && rect.height >= 44) {
      best = current;
    }
    current = current.parentElement;
  }

  return best;
}

function getLauncherPlacement(anchorElement) {
  const host = getHost();
  const rect = anchorElement.getBoundingClientRect();

  if (host.includes("office.com") || host.includes("officeapps.live.com") || host.includes("word-edit.officeapps.live.com")) {
    const top = Math.max(120, Math.min(window.innerHeight - 34, rect.top + 14));
    const left = Math.max(10, Math.min(window.innerWidth - 34, rect.left + 10));
    return { top, left };
  }

  if (host.includes("docs.google.com")) {
    const docsPage = document.querySelector(".kix-page, .kix-page-paginated");
    const pageRect = docsPage instanceof HTMLElement ? docsPage.getBoundingClientRect() : rect;
    const top = Math.max(220, Math.min(window.innerHeight - 34, pageRect.top + 82));
    const left = Math.max(14, Math.min(window.innerWidth - 34, pageRect.left - 22));
    return { top, left };
  }

  if (host.includes("claude.ai") || host.includes("anthropic.com") || host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
    const top = Math.max(12, Math.min(window.innerHeight - 52, rect.bottom - 38));
    const left = Math.max(12, Math.min(window.innerWidth - 52, rect.right - 34));
    return { top, left };
  }

  if (host.includes("mail.google.com")) {
    const top = Math.max(8, Math.min(window.innerHeight - 34, rect.bottom - 34));
    const left = Math.max(8, Math.min(window.innerWidth - 34, rect.right - 34));
    return { top, left };
  }

  const verticalMid = rect.top + Math.min(rect.height / 2, 80);
  const top = Math.max(8, Math.min(window.innerHeight - 34, verticalMid - 14));
  const preferredLeft = rect.right + 6;
  const fallbackLeft = rect.right - 34;
  const left = preferredLeft + 34 <= window.innerWidth
    ? preferredLeft
    : Math.max(8, Math.min(window.innerWidth - 34, fallbackLeft));

  return { top, left };
}

function getEditableText(element) {
  if (!element) {
    return "";
  }

  if (isGoogleDocsEditorSurface(element)) {
    return element.innerText || element.textContent || "";
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value || "";
  }

  return element.innerText || element.textContent || "";
}

function setEditableText(element, value) {
  if (isGoogleDocsEditorSurface(element)) {
    return;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      "value"
    )?.set;

    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  element.textContent = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function summarizeFindings(findings) {
  const counts = new Map();
  for (const finding of findings) {
    counts.set(finding.label, (counts.get(finding.label) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => `${count} ${label}`);
}

function toast(message) {
  const existing = document.querySelector(".ledebe-toast");
  if (existing) {
    existing.remove();
  }

  const node = document.createElement("div");
  node.className = "ledebe-toast";
  node.textContent = message;
  document.documentElement.appendChild(node);
  window.setTimeout(() => node.remove(), 2400);
}

function clearAllHighlights() {
  if (!HIGHLIGHT_SUPPORTED) {
    return;
  }

  CSS.highlights.delete("ledebe-sensitive-highlight");
  CSS.highlights.delete("ledebe-protected-highlight");
  return;
}

function collectTextNodes(root) {
  if (!(root instanceof Node)) {
    return [];
  }

  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent || isInsideLedebeUi(parent)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
}

function buildRangesFromOffsets(root, offsets) {
  if (!(root instanceof Node) || !offsets.length) {
    return [];
  }

  const textNodes = collectTextNodes(root);
  if (!textNodes.length) {
    return [];
  }

  const ranges = [];
  for (const offset of offsets) {
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;
    let cursor = 0;

    for (const node of textNodes) {
      const text = node.textContent || "";
      const nodeStart = cursor;
      const nodeEnd = cursor + text.length;

      if (!startNode && offset.start >= nodeStart && offset.start <= nodeEnd) {
        startNode = node;
        startOffset = Math.max(0, offset.start - nodeStart);
      }

      if (!endNode && offset.end >= nodeStart && offset.end <= nodeEnd) {
        endNode = node;
        endOffset = Math.max(0, offset.end - nodeStart);
      }

      cursor = nodeEnd;
      if (startNode && endNode) {
        break;
      }
    }

    if (!startNode || !endNode) {
      continue;
    }

    const range = new Range();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    ranges.push(range);
  }

  return ranges;
}

function getProtectedTokenOffsets(text) {
  const offsets = [];
  const regex = /\[LDB_[A-Z_0-9]+\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    offsets.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return offsets;
}

function supportsDirectTextReplacement(element) {
  return Boolean(element) && !isGoogleDocsEditorSurface(element);
}

function rememberRestoreSnapshot(element, value) {
  if (!element || restoreSnapshots.has(element)) {
    return;
  }

  restoreSnapshots.set(element, value);
  pendingRestoreState = {
    host: getHost(),
    text: value
  };
}

function replaceSessionPlaceholderMap(nextMap) {
  sessionPlaceholderMap.clear();
  for (const [token, original] of Object.entries(nextMap || {})) {
    if (token && typeof original === "string") {
      sessionPlaceholderMap.set(token, original);
    }
  }
}

async function loadSessionPlaceholderMap() {
  const stored = await safeSessionStorageGet(PLACEHOLDER_STORAGE_KEY);
  replaceSessionPlaceholderMap(stored[PLACEHOLDER_STORAGE_KEY] || {});
}

function persistSessionPlaceholderMap() {
  void safeSessionStorageSet({
    [PLACEHOLDER_STORAGE_KEY]: Object.fromEntries(sessionPlaceholderMap)
  });
}

function hasRestoreTarget(element) {
  if (element && restoreSnapshots.has(element)) {
    return true;
  }

  if (element && canRestoreFromMappings(element)) {
    return true;
  }

  return Boolean(pendingRestoreState?.host === getHost() && typeof pendingRestoreState?.text === "string");
}

function clearRestoreState(element) {
  if (element && restoreSnapshots.has(element)) {
    restoreSnapshots.delete(element);
  }

  pendingRestoreState = null;
}

function rememberPlaceholderReplacements(replacements = []) {
  let changed = false;
  for (const replacement of replacements) {
    if (!replacement?.token || typeof replacement.original !== "string") {
      continue;
    }
    if (sessionPlaceholderMap.get(replacement.token) !== replacement.original) {
      sessionPlaceholderMap.set(replacement.token, replacement.original);
      changed = true;
    }
  }

  if (changed) {
    persistSessionPlaceholderMap();
  }
}

function restoreKnownPlaceholdersInText(value) {
  let restored = value;
  let restoredCount = 0;

  for (const [token, original] of sessionPlaceholderMap.entries()) {
    if (!restored.includes(token)) {
      continue;
    }

    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let tokenCount = 0;
    restored = restored.replace(new RegExp(escaped, "g"), () => {
      tokenCount += 1;
      return original;
    });
    restoredCount += tokenCount;
  }

  return { restored, restoredCount };
}

function ensureSelectionButton() {
  if (selectionButton) {
    return selectionButton;
  }

  selectionButton = document.createElement("button");
  selectionButton.type = "button";
  selectionButton.className = "ledebe-selection-btn";
  selectionButton.textContent = "🛡 Add to Custom Terms";
  selectionButton.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await toggleSelectedTermProtection();
    hideSelectionButton();
  });
  document.documentElement.appendChild(selectionButton);
  return selectionButton;
}

function hideSelectionButton() {
  if (selectionButton) {
    selectionButton.style.display = "none";
  }
}

function showSelectionButton(text, x, y) {
  const button = ensureSelectionButton();
  const clean = text.trim().toLowerCase();
  const isProtected = (ledebeSettings.customTerms || []).some((term) => term.toLowerCase() === clean);

  button.dataset.selectionText = text.trim();
  button.dataset.mode = isProtected ? "unprotect" : "protect";
  button.innerHTML = isProtected
    ? `<span class="ledebe-selection-icon">+</span><span>Protected</span>`
    : `<span class="ledebe-selection-icon">🛡</span><span>Protect</span>`;
  button.title = isProtected ? "Remove this selection from custom protected terms" : "Add this selection to custom protected terms";
  button.style.display = "flex";
  button.style.left = `${Math.max(8, Math.min(x - 44, window.innerWidth - 116))}px`;
  button.style.top = `${Math.max(8, y - 34)}px`;
}

function applyVisualHints(element, findings) {
  clearAllHighlights();

  if (!HIGHLIGHT_SUPPORTED || !element || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return;
  }

  const fullText = getEditableText(element);
  const findingOffsets = findings.map((finding) => ({
    start: finding.index,
    end: finding.index + finding.value.length
  }));
  const protectedOffsets = getProtectedTokenOffsets(fullText);

  const sensitiveRanges = buildRangesFromOffsets(element, findingOffsets);
  if (sensitiveRanges.length) {
    CSS.highlights.set("ledebe-sensitive-highlight", new Highlight(...sensitiveRanges));
  }

  const protectedRanges = buildRangesFromOffsets(element, protectedOffsets);
  if (protectedRanges.length) {
    CSS.highlights.set("ledebe-protected-highlight", new Highlight(...protectedRanges));
  }
}

function ensureLauncher() {
  if (launcherRoot) {
    return launcherRoot;
  }

  const logoUrl = safeRuntimeGetUrl("ledebe-icon.png");
  launcherRoot = document.createElement("div");
  launcherRoot.className = "ledebe-launcher";
  launcherRoot.hidden = true;
  launcherRoot.innerHTML = `
    <div class="ledebe-launcher-rail" aria-hidden="true"></div>
    <div class="ledebe-fan-actions">
      <button type="button" class="ledebe-fan-btn ledebe-fan-btn-chat" data-action="chat">
        <span class="ledebe-fan-icon">AI</span>
        <span class="ledebe-fan-label">Chat</span>
      </button>
      <button type="button" class="ledebe-fan-btn ledebe-fan-btn-protect" data-action="protect">
        <span class="ledebe-fan-icon">P</span>
        <span class="ledebe-fan-label">Protect</span>
      </button>
      <button type="button" class="ledebe-fan-btn ledebe-fan-btn-restore" data-action="restore">
        <span class="ledebe-fan-icon">R</span>
        <span class="ledebe-fan-label">Restore</span>
      </button>
    </div>
    <button type="button" class="ledebe-launcher-main" aria-label="Ledebe assistant">
      <span class="ledebe-launcher-core">
        <img src="${logoUrl}" alt="Ledebe">
        <span class="ledebe-launcher-fallback" aria-hidden="true">🛡</span>
      </span>
      <span class="ledebe-launcher-count" hidden>0</span>
    </button>
  `;

  const launcherImage = launcherRoot.querySelector(".ledebe-launcher-core img");
  const launcherFallback = launcherRoot.querySelector(".ledebe-launcher-fallback");
  if (!logoUrl && launcherImage instanceof HTMLElement && launcherFallback instanceof HTMLElement) {
    launcherImage.hidden = true;
    launcherFallback.hidden = false;
  } else if (launcherImage instanceof HTMLImageElement && launcherFallback instanceof HTMLElement) {
    launcherImage.hidden = false;
    launcherFallback.hidden = true;
    launcherImage.addEventListener("error", () => {
      launcherImage.hidden = true;
      launcherFallback.hidden = false;
    }, { once: true });
  }

  launcherRoot.addEventListener("mouseenter", () => setLauncherExpanded(true));
  launcherRoot.addEventListener("mouseleave", () => scheduleLauncherCollapse());
  launcherRoot.querySelector(".ledebe-launcher-main").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const expanded = launcherRoot.classList.contains("is-expanded");
    launcherPinned = !expanded;
    setLauncherExpanded(!expanded);
  });

  for (const button of launcherRoot.querySelectorAll(".ledebe-fan-btn")) {
    button.addEventListener("pointerdown", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === "chat") {
        toggleAssistantPanel();
      } else if (action === "protect") {
        protectActiveField();
      } else if (action === "restore") {
        restoreActiveField();
      }
    });
  }

  document.documentElement.appendChild(launcherRoot);
  return launcherRoot;
}

function ensureAssistantPanel() {
  if (assistantPanel) {
    return assistantPanel;
  }

  assistantPanel = document.createElement("div");
  assistantPanel.className = "ledebe-chat-panel";
  assistantPanel.hidden = true;
  assistantPanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  document.documentElement.appendChild(assistantPanel);
  return assistantPanel;
}

function clampPanelPosition(left, top) {
  const panel = ensureAssistantPanel();
  const width = panel.offsetWidth || 340;
  const height = panel.offsetHeight || 420;
  const maxLeft = Math.max(12, window.innerWidth - width - 12);
  const maxTop = Math.max(12, window.innerHeight - height - 12);

  return {
    left: Math.max(12, Math.min(maxLeft, left)),
    top: Math.max(12, Math.min(maxTop, top))
  };
}

function setLauncherExpanded(expanded) {
  const launcher = ensureLauncher();
  if (launcherHideTimer) {
    clearTimeout(launcherHideTimer);
    launcherHideTimer = null;
  }

  launcher.classList.toggle("is-expanded", expanded);
  if (!expanded && !assistantOpen) {
    scheduleLauncherCollapse();
  }
}

function scheduleLauncherCollapse() {
  if (launcherPinned || assistantOpen) {
    return;
  }

  if (launcherHideTimer) {
    clearTimeout(launcherHideTimer);
  }

  launcherHideTimer = window.setTimeout(() => {
    if (!assistantOpen && !launcherPinned) {
      launcherRoot?.classList.remove("is-expanded");
    }
  }, 320);
}

function hideLauncher() {
  if (launcherRoot) {
    launcherRoot.hidden = true;
    launcherRoot.classList.remove("is-expanded");
    launcherRoot.classList.remove("is-paused");
  }
  launcherPinned = false;
  launcherAnchor = null;
  clearAllHighlights();
  hideSelectionButton();
}

function hideAssistantPanel() {
  assistantOpen = false;
  if (assistantPanel) {
    assistantPanel.hidden = true;
  }
  if (launcherRoot && !launcherRoot.matches(":hover") && !launcherPinned) {
    launcherRoot.classList.remove("is-expanded");
  }
}

function updateLauncherCount() {
  if (!launcherRoot) {
    return;
  }

  const countNode = launcherRoot.querySelector(".ledebe-launcher-count");
  const count = activeFindings.length;
  countNode.textContent = String(count);
  countNode.hidden = count === 0;
}

function updateLauncherPausedState() {
  if (!launcherRoot) {
    return;
  }

  const paused = isPausedForHost();
  launcherRoot.classList.toggle("is-paused", paused);

  const protectButton = launcherRoot.querySelector(".ledebe-fan-btn-protect");
  const restoreButton = launcherRoot.querySelector(".ledebe-fan-btn-restore");
  const chatButton = launcherRoot.querySelector(".ledebe-fan-btn-chat");

  if (protectButton) {
    protectButton.disabled = paused;
  }

  if (restoreButton) {
    restoreButton.disabled = false;
  }

  if (chatButton) {
    chatButton.disabled = false;
  }
}

function positionLauncher(element) {
  if (!element || !ledebeSettings.enabled) {
    hideLauncher();
    hideAssistantPanel();
    return;
  }

  const launcher = ensureLauncher();
  const anchorElement = getAnchorElementForLauncher(element);
  const placement = getLauncherPlacement(anchorElement);

  if (!launcherAnchor || launcherAnchor.element !== anchorElement) {
    launcherAnchor = { element: anchorElement };
  }

  launcher.style.top = `${placement.top}px`;
  launcher.style.left = `${placement.left}px`;
  launcher.hidden = false;
  updateLauncherCount();
  updateLauncherPausedState();

  if (assistantOpen) {
    positionAssistantPanel();
  }
}

function positionAssistantPanel() {
  if (!assistantOpen || !activeEditable) {
    return;
  }

  const panel = ensureAssistantPanel();

  if (panelManualPosition) {
    const clampedManual = clampPanelPosition(panelManualPosition.left, panelManualPosition.top);
    panel.style.top = `${clampedManual.top}px`;
    panel.style.left = `${clampedManual.left}px`;
    return;
  }

  const launcherRect = launcherRoot?.getBoundingClientRect();
  const rect = activeEditable.getBoundingClientRect();
  const baseLeft = launcherRect ? launcherRect.left - 320 : rect.right - 320;
  const baseTop = launcherRect ? launcherRect.top - 12 : rect.top - 12;
  const clamped = clampPanelPosition(baseLeft, baseTop);
  panel.style.top = `${clamped.top}px`;
  panel.style.left = `${clamped.left}px`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAssistantPanel() {
  if (!activeEditable || !ledebeSettings.enabled) {
    hideAssistantPanel();
    return;
  }

  const panel = ensureAssistantPanel();
  const canRestore = hasRestoreTarget(activeEditable);
  const findings = summarizeFindings(activeFindings);
  const customTerms = ledebeSettings.customTerms || [];
  const paused = isPausedForHost();
  const canDirectProtect = supportsDirectTextReplacement(activeEditable);

  panel.innerHTML = `
    <div class="ledebe-chat-header">
      <div>
        <div class="ledebe-chat-kicker">Ledebe Assistant</div>
        <h3>Mini privacy workspace</h3>
      </div>
      <button type="button" class="ledebe-chat-close" data-action="close">x</button>
    </div>
    <div class="ledebe-chat-body">
      <div class="ledebe-chat-card">
        <strong>Current field</strong>
        <p>${paused ? `Ledebe is paused on ${getHost()}. You can still manage settings or resume here.` : activeFindings.length ? `${activeFindings.length} sensitive item${activeFindings.length === 1 ? "" : "s"} detected.` : "No risky data detected right now."}</p>
        <div class="ledebe-finding-pills">
          ${paused ? `<span class="ledebe-pill muted">Paused on this site</span>` : findings.length ? findings.map((item) => `<span class="ledebe-pill">${escapeHtml(item)}</span>`).join("") : `<span class="ledebe-pill muted">Field looks clean</span>`}
        </div>
      </div>
      <div class="ledebe-chat-actions">
        <button type="button" class="ledebe-chat-action primary" data-action="protect-panel" ${(paused || !canDirectProtect) ? "disabled" : ""}>Protect this field</button>
        <button type="button" class="ledebe-chat-action" data-action="restore-panel" ${canRestore ? "" : "disabled"}>Restore original text</button>
        <button type="button" class="ledebe-chat-action" data-action="pause-panel">${paused ? "Resume on this site" : "Pause on this site"}</button>
      </div>
      ${!canDirectProtect ? `
        <div class="ledebe-chat-card">
          <strong>Google Docs mode</strong>
          <p>Use the shield on a selected word or phrase to add it to custom terms. Full in-place document replacement is disabled here for safety.</p>
        </div>
      ` : ""}
      <div class="ledebe-chat-card">
        <strong>Custom terms</strong>
        <p>Add names, project codes, client terms, or anything Ledebe should always protect.</p>
        <div class="ledebe-term-row">
          <input type="text" class="ledebe-term-input" placeholder="Add custom term">
          <button type="button" class="ledebe-chat-action compact" data-action="add-term">Add</button>
        </div>
        <div class="ledebe-term-list">
          ${customTerms.length ? customTerms.map((term, index) => `
            <button type="button" class="ledebe-term-pill" data-action="remove-term" data-index="${index}">
              <span>${escapeHtml(term)}</span>
              <span>x</span>
            </button>
          `).join("") : `<span class="ledebe-pill muted">No custom terms yet</span>`}
        </div>
      </div>
    </div>
  `;

  const closeButton = panel.querySelector("[data-action='close']");
  const protectButton = panel.querySelector("[data-action='protect-panel']");
  const restoreButton = panel.querySelector("[data-action='restore-panel']");
  const chatHeader = panel.querySelector(".ledebe-chat-header");
  const addButton = panel.querySelector("[data-action='add-term']");
  const input = panel.querySelector(".ledebe-term-input");

  closeButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    hideAssistantPanel();
  });

  protectButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    protectActiveField();
    renderAssistantPanel();
  });

  restoreButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    restoreActiveField();
    renderAssistantPanel();
  });

  panel.querySelector("[data-action='pause-panel']").addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    await togglePauseSite();
    renderAssistantPanel();
  });

  addButton.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    const term = input.value.trim();
    if (!term) {
      toast("Enter a custom term first.");
      return;
    }

    const nextTerms = Array.from(new Set([...(ledebeSettings.customTerms || []), term]));
    await safeStorageSet({ customTerms: nextTerms });
    ledebeSettings.customTerms = nextTerms;
    input.value = "";
    analyzeElement(activeEditable);
    renderAssistantPanel();
    toast("Custom term added.");
  });

  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    addButton.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });

  for (const button of panel.querySelectorAll("[data-action='remove-term']")) {
    button.addEventListener("pointerdown", async (event) => {
      event.preventDefault();
      const index = Number(button.dataset.index);
      const nextTerms = [...(ledebeSettings.customTerms || [])];
      nextTerms.splice(index, 1);
      await safeStorageSet({ customTerms: nextTerms });
      ledebeSettings.customTerms = nextTerms;
      analyzeElement(activeEditable);
      renderAssistantPanel();
      toast("Custom term removed.");
    });
  }

  chatHeader.addEventListener("pointerdown", (event) => {
    if (event.target instanceof HTMLElement && event.target.closest("[data-action='close']")) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    panelDragState = {
      startX: event.clientX,
      startY: event.clientY,
      originLeft: panelRect.left,
      originTop: panelRect.top
    };
    launcherPinned = true;
    panel.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  assistantOpen = true;
  panel.hidden = false;
  launcherPinned = true;
  setLauncherExpanded(true);
  positionAssistantPanel();
}

function toggleAssistantPanel() {
  if (assistantOpen) {
    hideAssistantPanel();
    return;
  }

  renderAssistantPanel();
}

function analyzeElement(element) {
  if (!ledebeSettings.enabled || !element) {
    activeFindings = [];
    hideLauncher();
    hideAssistantPanel();
    return [];
  }

  const text = getEditableText(element).trim();
  positionLauncher(element);

  if (!text) {
    activeFindings = [];
    updateLauncherCount();
    updateLauncherPausedState();
    clearAllHighlights();
    if (assistantOpen) {
      renderAssistantPanel();
    }
    return [];
  }

  activeFindings = isPausedForHost() ? [] : detectPII(text, ledebeSettings.customTerms);
  updateLauncherCount();
  updateLauncherPausedState();
  applyVisualHints(element, activeFindings);

  if (assistantOpen) {
    renderAssistantPanel();
  }

  return activeFindings;
}

function protectTextValue(value) {
  return maskText(value, ledebeSettings.customTerms);
}

function protectOnlyExactTerm(value, term) {
  if (!term.trim()) {
    return { masked: value, replacements: [] };
  }

  const regex = new RegExp(escapeForRegex(term), "gi");
  let replaced = false;
  const masked = value.replace(regex, () => {
    replaced = true;
    return "[LDB_CUSTOM_1]";
  });

  return {
    masked,
    replacements: replaced ? [{ token: "[LDB_CUSTOM_1]", original: term }] : []
  };
}

function protectSelectedTermAcrossField(term) {
  const element = activeEditable;
  if (!element || !supportsDirectTextReplacement(element)) {
    return { replacements: [] };
  }

  const original = getEditableText(element);
  const result = protectOnlyExactTerm(original, term);
  if (!result.replacements.length) {
    return result;
  }

  rememberRestoreSnapshot(element, original);
  rememberPlaceholderReplacements(result.replacements);
  setEditableText(element, result.masked);
  analyzeElement(element);
  return result;
}

function protectActiveField() {
  if (!activeEditable) {
    toast("Focus a text field first.");
    return;
  }

  if (!supportsDirectTextReplacement(activeEditable)) {
    toast("Use the selection shield to add words from Google Docs to custom terms.");
    return;
  }

  const original = getEditableText(activeEditable);
  const result = protectTextValue(original);
  if (!result.replacements.length) {
    toast("Nothing sensitive found in this field.");
    return;
  }

  rememberRestoreSnapshot(activeEditable, original);
  rememberPlaceholderReplacements(result.replacements);
  setEditableText(activeEditable, result.masked);
  analyzeElement(activeEditable);
  toast(`Protected ${result.replacements.length} item${result.replacements.length === 1 ? "" : "s"}.`);
}

function restoreActiveField() {
  if (!activeEditable) {
    toast("Focus a text field first.");
    return;
  }

  if (!supportsDirectTextReplacement(activeEditable)) {
    toast("Restore is only available for fields Ledebe can edit directly.");
    return;
  }

  if (shouldHandlePlaceholderRestore(activeEditable)) {
    if (restoreFromMappings(activeEditable)) {
      return;
    }
  }

  const original = restoreSnapshots.get(activeEditable) ?? (
    pendingRestoreState?.host === getHost() ? pendingRestoreState.text : undefined
  );
  if (typeof original !== "string") {
    toast("No Ledebe restore point for this field yet.");
    return;
  }

  setEditableText(activeEditable, original);
  clearRestoreState(activeEditable);
  analyzeElement(activeEditable);
  toast("Original text restored.");
}

function protectSelection() {
  const element = activeEditable;
  if (!element) {
    toast("Focus a text field first.");
    return;
  }

  if (!supportsDirectTextReplacement(element)) {
    toast("Use the selection shield to add Google Docs text to custom terms.");
    return;
  }

  rememberRestoreSnapshot(element, getEditableText(element));

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    if (start === end) {
      protectActiveField();
      return;
    }

    const value = element.value;
    const selected = value.slice(start, end);
    const result = protectTextValue(selected);
    if (!result.replacements.length) {
      toast("No sensitive text found in the selection.");
      return;
    }

    rememberPlaceholderReplacements(result.replacements);
    const next = value.slice(0, start) + result.masked + value.slice(end);
    setEditableText(element, next);
    element.setSelectionRange(start, start + result.masked.length);
    analyzeElement(element);
    toast(`Protected ${result.replacements.length} selected item${result.replacements.length === 1 ? "" : "s"}.`);
    return;
  }

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || selection.isCollapsed) {
    protectActiveField();
    return;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();
  const result = protectTextValue(selectedText);
  if (!result.replacements.length) {
    toast("No sensitive text found in the selection.");
    return;
  }

  rememberPlaceholderReplacements(result.replacements);
  range.deleteContents();
  range.insertNode(document.createTextNode(result.masked));
  analyzeElement(element);
  toast(`Protected ${result.replacements.length} selected item${result.replacements.length === 1 ? "" : "s"}.`);
}

async function toggleSelectedTermProtection() {
  const selectedText = selectionButton?.dataset.selectionText?.trim();
  if (!selectedText) {
    toast("Highlight a word or phrase first.");
    return;
  }

  const customTerms = [...(ledebeSettings.customTerms || [])];
  const normalized = selectedText.toLowerCase();
  const existingIndex = customTerms.findIndex((term) => term.toLowerCase() === normalized);

  if (existingIndex >= 0) {
    customTerms.splice(existingIndex, 1);
    await safeStorageSet({ customTerms });
    ledebeSettings.customTerms = customTerms;
    analyzeElement(activeEditable);
    if (assistantOpen) {
      renderAssistantPanel();
    }
    toast(`"${selectedText}" removed from protected terms.`);
    return;
  }

  customTerms.push(selectedText);
  await safeStorageSet({ customTerms });
  ledebeSettings.customTerms = customTerms;

  if (activeEditable) {
    const result = protectSelectedTermAcrossField(selectedText);
    if (!result.replacements.length) {
      analyzeElement(activeEditable);
    }
  }

  if (assistantOpen) {
    renderAssistantPanel();
  }

  toast(`"${selectedText}" added to protected terms and protected across this field.`);
}

async function togglePauseSite() {
  const pausedHosts = new Set(ledebeSettings.pausedHosts || []);
  const host = getHost();

  if (pausedHosts.has(host)) {
    pausedHosts.delete(host);
    await safeStorageSet({ pausedHosts: Array.from(pausedHosts) });
    ledebeSettings.pausedHosts = Array.from(pausedHosts);
    toast("Ledebe resumed on this site.");
  } else {
    pausedHosts.add(host);
    await safeStorageSet({ pausedHosts: Array.from(pausedHosts) });
    ledebeSettings.pausedHosts = Array.from(pausedHosts);
    toast("Ledebe paused on this site.");
  }

  if (activeEditable) {
    analyzeElement(activeEditable);
  }
}

function handleFocus(event) {
  const target = resolveEditableElement(event.target);
  if (!target) {
    return;
  }

  activeEditable = target;
  rememberTextCueRect(target.getBoundingClientRect());
  analyzeElement(target);
}

function handleInput(event) {
  const target = resolveEditableElement(event.target);
  if (!target) {
    return;
  }

  activeEditable = target;
  rememberTextCueRect(target.getBoundingClientRect());
  analyzeElement(target);
}

function handlePaste(event) {
  const target = resolveEditableElement(event.target);
  if (!target || !ledebeSettings.scanOnPaste) {
    return;
  }

  activeEditable = target;
  rememberTextCueRect(target.getBoundingClientRect());
  window.setTimeout(() => analyzeElement(target), 10);
}

function handleFocusOut(event) {
  const target = resolveEditableElement(event.target);
    if (!target || target !== activeEditable) {
    return;
  }

  window.setTimeout(() => {
    const next = resolveEditableElement(document.activeElement);
    if (!next && !assistantOpen && !launcherPinned) {
      hideLauncher();
    }
  }, 0);
}

function handleSelectionChange() {
  const selection = document.getSelection();
  if (!selection) {
    hideSelectionButton();
    return;
  }

  const target = getSelectionEditableTarget(selection);
  if (!target || isPausedForHost() || !ledebeSettings.enabled) {
    hideSelectionButton();
    return;
  }

  activeEditable = target;
  if (supportsDirectTextReplacement(target)) {
    analyzeElement(target);
  } else {
    positionLauncher(target);
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length > 1) {
    setLauncherExpanded(true);
    const cueRect = getSelectionRect(selection);
    rememberTextCueRect(cueRect);
    const buttonPosition = getSelectionButtonPosition(selection, target);
    if (buttonPosition) {
      showSelectionButton(selectedText, buttonPosition.x, buttonPosition.y);
    }
  } else {
    const cueRect = getSelectionRect(selection);
    rememberTextCueRect(cueRect);
    hideSelectionButton();
  }
}

function handlePointerDown(event) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (launcherRoot?.contains(target) || assistantPanel?.contains(target) || selectionButton?.contains(target)) {
    return;
  }

  launcherPinned = false;
  launcherRoot?.classList.remove("is-expanded");
  hideAssistantPanel();
  hideSelectionButton();
}

function handlePointerMove(event) {
  if (!panelDragState || !assistantOpen || !assistantPanel) {
    return;
  }

  const nextLeft = panelDragState.originLeft + (event.clientX - panelDragState.startX);
  const nextTop = panelDragState.originTop + (event.clientY - panelDragState.startY);
  const clamped = clampPanelPosition(nextLeft, nextTop);
  panelManualPosition = clamped;
  assistantPanel.style.left = `${clamped.left}px`;
  assistantPanel.style.top = `${clamped.top}px`;
}

function handlePointerUp() {
  window.setTimeout(() => {
    const selection = document.getSelection();
    const selectedText = selection?.toString().trim() || "";
    if (selectedText.length > 1 && getSelectionEditableTarget(selection)) {
      handleSelectionChange();
      return;
    }

    if (!selectedText) {
      hideSelectionButton();
    }
  }, 0);

  panelDragState = null;
}

function handleSubmit(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || !ledebeSettings.safeSend || isPausedForHost()) {
    return;
  }

  const fields = Array.from(form.querySelectorAll("textarea, input, [contenteditable='true']"));
  const riskyField = fields.find((field) => isEditableElement(field) && detectPII(getEditableText(field), ledebeSettings.customTerms).length);
  if (!riskyField) {
    return;
  }

  const now = Date.now();
  if (warnedEditable === riskyField && now - warnedAt < 7000) {
    return;
  }

  warnedEditable = riskyField;
  warnedAt = now;
  event.preventDefault();
  event.stopPropagation();
  activeEditable = riskyField;
  analyzeElement(riskyField);
  setLauncherExpanded(true);
  toast("Sensitive data detected. Protect it or submit again to confirm.");
}

async function loadSettings() {
  const stored = await safeStorageGet(LEDEBE_DEFAULT_SETTINGS);
  ledebeSettings = {
    ...LEDEBE_DEFAULT_SETTINGS,
    ...stored
  };
}

if (hasValidExtensionContext()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "session" || areaName === "local") {
      if (changes[PLACEHOLDER_STORAGE_KEY]) {
        replaceSessionPlaceholderMap(changes[PLACEHOLDER_STORAGE_KEY].newValue || {});
      }
      return;
    }

    if (areaName !== "sync") {
      return;
    }

    for (const [key, value] of Object.entries(changes)) {
      ledebeSettings[key] = value.newValue;
    }

    if (assistantOpen) {
      renderAssistantPanel();
    }

    if (activeEditable) {
      analyzeElement(activeEditable);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_STATE") {
      sendResponse({
        host: getHost(),
        enabled: ledebeSettings.enabled,
        paused: isPausedForHost(),
        activeFindings: activeFindings.length,
        activeSummary: summarizeFindings(activeFindings)
      });
      return true;
    }

    if (message.type === "PROTECT_ACTIVE_FIELD") {
      protectActiveField();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "PROTECT_SELECTION") {
      protectSelection();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "RESCAN_ACTIVE_FIELD") {
      if (activeEditable) {
        analyzeElement(activeEditable);
      }
      sendResponse({ ok: true });
      return true;
    }

    return false;
  });
}

Promise.all([loadSettings(), loadSessionPlaceholderMap()]).then(() => {
  document.addEventListener("focusin", handleFocus, true);
  document.addEventListener("focusout", handleFocusOut, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("pointermove", handlePointerMove, true);
  document.addEventListener("pointerup", handlePointerUp, true);
  document.addEventListener("selectionchange", handleSelectionChange, true);
  document.addEventListener("input", handleInput, true);
  document.addEventListener("paste", handlePaste, true);
  document.addEventListener("submit", handleSubmit, true);
  window.addEventListener("scroll", () => positionLauncher(activeEditable), true);
  window.addEventListener("resize", () => positionLauncher(activeEditable), true);
  window.addEventListener("scroll", hideSelectionButton, true);
  window.addEventListener("resize", hideSelectionButton, true);
});
