const LEDEBE_DEFAULT_SETTINGS = {
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
const MAX_SESSION_PLACEHOLDERS = 500;
const HIGHLIGHT_SUPPORTED = typeof globalThis.CSS !== "undefined" && Boolean(globalThis.CSS.highlights) && typeof globalThis.Highlight !== "undefined";
let analyzeTimer = null;
let pendingAnalyzeElement = null;
let autoProtectAiTimer = null;
let aiComposerObserver = null;
let observedAiComposer = null;

const AUTO_PROTECT_AI_IDLE_MS = 650;

const AI_SITE_HOST_PATTERNS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "anthropic.com",
  "gemini.google.com",
  "perplexity.ai",
  "copilot.microsoft.com",
  "poe.com"
];

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
    if (!hasValidExtensionContext() || !chrome.storage?.session) {
      return {};
    }
    return await chrome.storage.session.get(key);
  } catch (error) {
    return {};
  }
}

async function safeSessionStorageSet(value) {
  try {
    if (!hasValidExtensionContext() || !chrome.storage?.session) {
      return false;
    }
    await chrome.storage.session.set(value);
    return true;
  } catch (error) {
    return false;
  }
}

// The placeholder map lives in local storage (survives browser restarts) when
// "persist mappings" is on, or session storage (cleared on close) when off.
function mappingAreaName() {
  return ledebeSettings.persistMappings ? "local" : "session";
}

function mappingStore() {
  return ledebeSettings.persistMappings ? chrome.storage?.local : chrome.storage?.session;
}

async function safeMappingGet(key) {
  try {
    const store = mappingStore();
    if (!hasValidExtensionContext() || !store) {
      return {};
    }
    return await store.get(key);
  } catch (error) {
    return {};
  }
}

async function safeMappingSet(value) {
  try {
    const store = mappingStore();
    if (!hasValidExtensionContext() || !store) {
      return false;
    }
    await store.set(value);
    return true;
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

  if (!supportsDirectTextReplacement(element)) {
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

function restoreKnownPlaceholdersInNodeTree(root) {
  if (!(root instanceof Node)) {
    return { restoredCount: 0 };
  }

  const textNodes = collectTextNodes(root);
  let restoredCount = 0;

  for (const node of textNodes) {
    const currentText = node.textContent || "";
    let nextText = currentText;
    let changed = false;

    for (const [token, original] of sessionPlaceholderMap.entries()) {
      if (!nextText.includes(token)) {
        continue;
      }

      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let tokenCount = 0;
      nextText = nextText.replace(new RegExp(escaped, "g"), () => {
        tokenCount += 1;
        return original;
      });

      if (tokenCount > 0) {
        restoredCount += tokenCount;
        changed = true;
      }
    }

    if (changed) {
      node.textContent = nextText;
    }
  }

  return { restoredCount };
}

function restoreFromMappings(element) {
  if (isGoogleDocsEditorSurface(element)) {
    if (getEditableText(element).includes("[LDB_")) {
      toast("Google Docs restore is not available in v1 yet. Paste the protected text into a plain editable field to restore it.");
      return true;
    }
    return false;
  }

  const currentText = getEditableText(element);

  if (!currentText.includes("[LDB_")) {
    return false;
  }

  const restoredPlaceholders = restoreKnownPlaceholdersInText(currentText);
  if (restoredPlaceholders.restoredCount > 0) {
    setEditableText(element, restoredPlaceholders.restored);
    analyzeElement(element);
    toast(`Restored ${restoredPlaceholders.restoredCount} protected item${restoredPlaceholders.restoredCount === 1 ? "" : "s"} in this text.`);
    return true;
  }

  if (sessionPlaceholderMap.size === 0) {
    showMissingPlaceholderMappingToast();
  } else {
    toast("Placeholders here don't match any mappings Ledebe has stored this session — they may be from a different Protect run.");
  }
  return true;
}

function getHost() {
  return window.location.hostname;
}

function hostMatchesAny(patterns) {
  const host = getHost();
  return patterns.some((pattern) => host.includes(pattern));
}

function isTopLevelFrame() {
  try {
    return window.self === window.top;
  } catch (error) {
    return false;
  }
}

function isGoogleDocsHost() {
  return getHost().includes("docs.google.com");
}

function isGoogleDocsTextFrame() {
  if (!isGoogleDocsHost()) {
    return false;
  }

  const frameElement = window.frameElement;
  return frameElement instanceof HTMLIFrameElement && frameElement.classList.contains("docs-texteventtarget-iframe");
}

function shouldInitializeInCurrentFrame() {
  return isTopLevelFrame() || isGoogleDocsTextFrame();
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

function getAiComposerElement(node) {
  if (!(node instanceof HTMLElement) || !isAiComposerHost()) {
    return null;
  }

  if (node.matches('[role="textbox"][contenteditable="true"], [role="textbox"][contenteditable=""]')) {
    return node;
  }

  const descendant = node.querySelector?.('[role="textbox"][contenteditable="true"], [role="textbox"][contenteditable=""]');
  if (descendant instanceof HTMLElement) {
    return descendant;
  }

  const ancestor = node.closest?.('[role="textbox"][contenteditable="true"], [role="textbox"][contenteditable=""]');
  if (ancestor instanceof HTMLElement) {
    return ancestor;
  }

  return null;
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

  const aiComposer = getAiComposerElement(node);
  if (aiComposer) {
    return aiComposer;
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

function getActiveSelection() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount) {
    return selection;
  }

  return null;
}

function hasExpandedSelection() {
  const selection = getActiveSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim().length);
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

function getDocsPageElement(anchorElement) {
  const pages = Array.from(document.querySelectorAll(".kix-page, .kix-page-paginated"))
    .filter((node) => node instanceof HTMLElement);
  if (!pages.length) {
    return null;
  }

  const cueRect = getCaretOrSelectionRect(anchorElement);
  if (cueRect) {
    const cueX = cueRect.left + (cueRect.width / 2);
    const cueY = cueRect.top + (cueRect.height / 2);

    const containing = pages.find((page) => {
      const rect = page.getBoundingClientRect();
      return cueX >= rect.left && cueX <= rect.right && cueY >= rect.top && cueY <= rect.bottom;
    });
    if (containing) {
      return containing;
    }

    const nearest = pages
      .map((page) => {
        const rect = page.getBoundingClientRect();
        const dx = Math.max(rect.left - cueX, 0, cueX - rect.right);
        const dy = Math.max(rect.top - cueY, 0, cueY - rect.bottom);
        return { page, distance: Math.hypot(dx, dy) };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest?.page) {
      return nearest.page;
    }
  }

  if (anchorElement instanceof HTMLElement) {
    const closest = anchorElement.closest(".kix-page, .kix-page-paginated");
    if (closest instanceof HTMLElement) {
      return closest;
    }
  }

  return pages[0] || null;
}

function getAnchorElementForLauncher(element) {
  if (!(element instanceof HTMLElement)) {
    return element;
  }

  const host = getHost();

  if (isGoogleDocsEditorSurface(element)) {
    const docsPage = getDocsPageElement(element);
    if (docsPage instanceof HTMLElement) {
      return docsPage;
    }

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
    const docsPage = getDocsPageElement(anchorElement);
    const pageRect = docsPage instanceof HTMLElement ? docsPage.getBoundingClientRect() : rect;
    const cueRect = getCaretOrSelectionRect(anchorElement);
    const top = Math.max(220, Math.min(window.innerHeight - 34, pageRect.top + 82));
    const left = cueRect
      ? Math.max(14, Math.min(window.innerWidth - 34, cueRect.left - 44))
      : Math.max(14, Math.min(window.innerWidth - 34, pageRect.left + 12));
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

function getAiComposerText(element) {
  if (!(element instanceof HTMLElement)) {
    return "";
  }

  const textbox = getAiComposerElement(element) || element;

  const clone = textbox.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return textbox.innerText || textbox.textContent || "";
  }

  clone.querySelectorAll('button, svg, img, [aria-hidden="true"], [contenteditable="false"]').forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));

  for (const block of clone.querySelectorAll("p, div, li")) {
    if (!block.textContent?.endsWith("\n")) {
      block.append("\n");
    }
  }

  return (clone.innerText || clone.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
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

  if (isAiComposerSurface(element)) {
    return getAiComposerText(element);
  }

  return element.innerText || element.textContent || "";
}

function isAiComposerHost() {
  return hostMatchesAny([
    "chatgpt.com",
    "chat.openai.com",
    "claude.ai",
    "anthropic.com"
  ]);
}

function isAiAssistantHost() {
  return hostMatchesAny(AI_SITE_HOST_PATTERNS);
}

function isAiComposerSurface(element) {
  const composer = getAiComposerElement(element);
  if (!(composer instanceof HTMLElement) || !composer.isContentEditable || !isAiComposerHost()) {
    return false;
  }

  return true;
}

function isRichTextContentEditable(element) {
  if (!element || !element.isContentEditable || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return false;
  }

  if (isGoogleDocsEditorSurface(element)) {
    return true;
  }

  if (isAiComposerSurface(element)) {
    return false;
  }

  return element.childElementCount > 0;
}

function setEditableText(element, value) {
  const aiComposer = getAiComposerElement(element);
  if (aiComposer) {
    element = aiComposer;
  }

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

  if (element.isContentEditable) {
    element.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    let applied = false;
    try {
      if (typeof document.execCommand === "function") {
        applied = document.execCommand("insertText", false, value);
      }
    } catch (error) {
      applied = false;
    }

    if (!applied) {
      element.textContent = value;
    }

    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: value
    }));
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
  const regex = /\[LDB_[A-Z0-9_]+\]/g;
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
  if (!element || isGoogleDocsEditorSurface(element)) {
    return false;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return true;
  }

  if (isAiComposerSurface(element)) {
    return true;
  }

  return !isRichTextContentEditable(element);
}

function createPlaceholderNamespace() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function createCustomPlaceholderToken(namespace, count = 1) {
  return namespace ? `[LDB_CUSTOM_${namespace}_${count}]` : `[LDB_CUSTOM_${count}]`;
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
  const stored = await safeMappingGet(PLACEHOLDER_STORAGE_KEY);
  replaceSessionPlaceholderMap(stored[PLACEHOLDER_STORAGE_KEY] || {});
}

function persistSessionPlaceholderMap() {
  void safeMappingSet({
    [PLACEHOLDER_STORAGE_KEY]: Object.fromEntries(sessionPlaceholderMap)
  });
}

// When the user flips "persist mappings", move the current in-memory map into
// the newly-active store and clear it from the other, so nothing is lost and no
// stale copy lingers in the store we're no longer using.
function migratePlaceholderStore() {
  persistSessionPlaceholderMap();
  const otherStore = ledebeSettings.persistMappings ? chrome.storage?.session : chrome.storage?.local;
  try {
    void otherStore?.remove?.(PLACEHOLDER_STORAGE_KEY);
  } catch (error) {
    // ignore
  }
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
      sessionPlaceholderMap.delete(replacement.token);
      sessionPlaceholderMap.set(replacement.token, replacement.original);
      while (sessionPlaceholderMap.size > MAX_SESSION_PLACEHOLDERS) {
        const firstKey = sessionPlaceholderMap.keys().next().value;
        if (!firstKey) {
          break;
        }
        sessionPlaceholderMap.delete(firstKey);
      }
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

function replaceCurrentSelectionWithText(nextText) {
  const selection = getActiveSelection();
  if (!selection || !selection.rangeCount || selection.isCollapsed) {
    return false;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(nextText);
  range.insertNode(node);

  const collapsed = document.createRange();
  collapsed.setStartAfter(node);
  collapsed.collapse(true);
  selection.removeAllRanges();
  selection.addRange(collapsed);
  return true;
}

function protectCurrentDocsSelection(selectedText, replacementsBuilder) {
  if (!activeEditable || !isGoogleDocsEditorSurface(activeEditable)) {
    return { replacements: [] };
  }

  const term = selectedText.trim();
  if (!term) {
    return { replacements: [] };
  }

  const result = replacementsBuilder(term);
  if (!result.replacements.length) {
    return result;
  }

  rememberPlaceholderReplacements(result.replacements);
  if (!replaceCurrentSelectionWithText(result.masked)) {
    return { replacements: [] };
  }

  analyzeElement(activeEditable);
  return result;
}

function ensureSelectionButton() {
  if (selectionButton) {
    return selectionButton;
  }

  selectionButton = document.createElement("button");
  selectionButton.type = "button";
  selectionButton.className = "ledebe-selection-btn";
  selectionButton.textContent = "Protect";
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
    : `<span class="ledebe-selection-icon">+</span><span>Protect</span>`;
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
        restoreActiveField();          // restore inside a focused input, if any
        openRestoredAnswerTray();      // and surface the AI reply in the side panel
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
  if (expanded) {
    ensureLauncherFanOnScreen();
  } else if (!assistantOpen) {
    scheduleLauncherCollapse();
  }
}

// The fan tray opens to one side of the main icon. Measure the tray after
// layout and flip the open direction if it would spill off either edge, so the
// sub-icons are always visible regardless of where the icon is anchored.
function ensureLauncherFanOnScreen() {
  const fan = launcherRoot?.querySelector(".ledebe-fan-actions");
  if (!fan) {
    return;
  }

  requestAnimationFrame(() => {
    if (!launcherRoot) {
      return;
    }
    const rect = fan.getBoundingClientRect();
    const margin = 6;
    if (rect.left < margin) {
      launcherRoot.classList.add("opens-right");
    } else if (rect.right > window.innerWidth - margin) {
      launcherRoot.classList.remove("opens-right");
    }
  });
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
  launcher.classList.toggle("opens-right", placement.left < (window.innerWidth * 0.5));
  launcher.hidden = false;
  if (launcher.classList.contains("is-expanded")) {
    ensureLauncherFanOnScreen();
  }
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

function scheduleAnalyzeElement(element, delay = 120) {
  if (!element) {
    return;
  }

  pendingAnalyzeElement = element;
  if (analyzeTimer) {
    clearTimeout(analyzeTimer);
  }

  analyzeTimer = window.setTimeout(() => {
    const next = pendingAnalyzeElement;
    pendingAnalyzeElement = null;
    analyzeTimer = null;
    if (next) {
      analyzeElement(next);
    }
  }, delay);
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
  const isRichEditor = isRichTextContentEditable(activeEditable);

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
        <p>${paused ? `Ledebe is paused on ${escapeHtml(getHost())}. You can still manage settings or resume here.` : activeFindings.length ? `${activeFindings.length} sensitive item${activeFindings.length === 1 ? "" : "s"} detected.` : "No risky data detected right now."}</p>
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
          <strong>${isGoogleDocsEditorSurface(activeEditable) ? "Google Docs mode" : "Rich text mode"}</strong>
          <p>${isGoogleDocsEditorSurface(activeEditable)
            ? "Use the selection button on a highlighted word or phrase to add it to custom terms. Full in-place document replacement is disabled here for safety."
            : isRichEditor
              ? "Whole-field replace is disabled here to avoid stripping formatting. Use the selection button for targeted protection."
              : "Full in-place replacement is disabled here for safety."}</p>
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

function shouldAutoProtectAiPrompt(element = activeEditable) {
  if (!ledebeSettings.enabled || !ledebeSettings.autoProtectAiPrompts || isPausedForHost() || !isAiAssistantHost()) {
    return false;
  }

  if (!element || !supportsDirectTextReplacement(element)) {
    return false;
  }

  const text = getEditableText(element);
  if (!text.trim() || text.includes("[LDB_")) {
    return false;
  }

  return detectPII(text, ledebeSettings.customTerms).length > 0;
}

function autoProtectAiPromptIfNeeded(element = activeEditable) {
  if (!shouldAutoProtectAiPrompt(element)) {
    return false;
  }

  const previousActive = activeEditable;
  activeEditable = element;
  protectActiveField();
  activeEditable = element || previousActive;
  return true;
}

function stopAiComposerObserver() {
  if (aiComposerObserver) {
    aiComposerObserver.disconnect();
    aiComposerObserver = null;
  }
  observedAiComposer = null;
}

function resolveAutoProtectTarget(preferredElement = activeEditable) {
  return preferredElement
    || activeEditable
    || resolveEditableElement(document.activeElement)
    || getSelectionEditableTarget(getActiveSelection());
}

function scheduleAutoProtectAiPrompt(element = activeEditable, delay = AUTO_PROTECT_AI_IDLE_MS) {
  if (autoProtectAiTimer) {
    clearTimeout(autoProtectAiTimer);
    autoProtectAiTimer = null;
  }

  const target = resolveAutoProtectTarget(element);
  if (!target) {
    return;
  }

  autoProtectAiTimer = window.setTimeout(() => {
    autoProtectAiTimer = null;
    const latestTarget = resolveAutoProtectTarget(target);
    if (!latestTarget) {
      return;
    }
    autoProtectAiPromptIfNeeded(latestTarget);
  }, delay);
}

function observeAiComposer(element) {
  const composer = getAiComposerElement(element);
  if (!composer || !isAiAssistantHost()) {
    stopAiComposerObserver();
    return;
  }

  if (observedAiComposer === composer && aiComposerObserver) {
    return;
  }

  stopAiComposerObserver();
  observedAiComposer = composer;
  aiComposerObserver = new MutationObserver(() => {
    activeEditable = composer;
    scheduleAnalyzeElement(composer, 80);
    scheduleAutoProtectAiPrompt(composer, 220);
  });
  aiComposerObserver.observe(composer, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

function isAiSendTrigger(target) {
  if (!(target instanceof HTMLElement) || !isAiAssistantHost()) {
    return false;
  }

  const clickable = target.closest('button, [role="button"], input[type="submit"], input[type="button"]');
  if (!(clickable instanceof HTMLElement)) {
    return false;
  }

  const label = [
    clickable.getAttribute("aria-label"),
    clickable.getAttribute("data-testid"),
    clickable.getAttribute("title"),
    clickable.textContent
  ].join(" ").toLowerCase();

  return /\b(send|submit|up|arrow up|ask|message)\b/.test(label);
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
  return maskText(value, ledebeSettings.customTerms, {
    namespace: createPlaceholderNamespace()
  });
}

function protectOnlyExactTerm(value, term) {
  if (!term.trim()) {
    return { masked: value, replacements: [] };
  }

  const regex = new RegExp(escapeForRegex(term), "gi");
  const token = createCustomPlaceholderToken(createPlaceholderNamespace());
  let replaced = false;
  const masked = value.replace(regex, () => {
    replaced = true;
    return token;
  });

  return {
    masked,
    replacements: replaced ? [{ token, original: term }] : []
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

  if (isGoogleDocsEditorSurface(activeEditable)) {
    if (hasExpandedSelection()) {
      protectSelection();
    } else {
      toast("Highlight a word or phrase first, then click Protect.");
    }
    return;
  }

  if (!supportsDirectTextReplacement(activeEditable)) {
    toast(
      isGoogleDocsEditorSurface(activeEditable)
        ? "Use the selection button to protect words in Google Docs."
        : "Whole-field protect is disabled here to preserve formatting. Use the selection button instead."
    );
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

  if (shouldHandlePlaceholderRestore(activeEditable)) {
    if (restoreFromMappings(activeEditable)) {
      return;
    }
  }

  if (!supportsDirectTextReplacement(activeEditable)) {
    toast(
      isGoogleDocsEditorSurface(activeEditable)
        ? "Google Docs restore is not available in v1 yet. Paste the protected text into a plain editable field to restore it."
        : "Restore is only available in plain editable fields Ledebe can update safely."
    );
    return;
  }

  const original = restoreSnapshots.get(activeEditable) ?? (
    pendingRestoreState?.host === getHost() ? pendingRestoreState.text : undefined
  );
  if (typeof original !== "string") {
    const currentText = getEditableText(activeEditable);
    if (currentText.includes("[LDB_")) {
      showMissingPlaceholderMappingToast();
    } else {
      toast("Nothing to restore — protect a field first, or paste text containing [LDB_*] placeholders from a Protect run earlier in this browser session.");
    }
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

  if (isGoogleDocsEditorSurface(element)) {
    const selection = getActiveSelection();
    const selectedText = selection?.toString() || "";
    const result = protectCurrentDocsSelection(selectedText, (value) => protectTextValue(value));
    if (!result.replacements.length) {
      toast("Highlight sensitive text first.");
      return;
    }

    toast(`Protected ${result.replacements.length} selected item${result.replacements.length === 1 ? "" : "s"}.`);
    return;
  }

  if (!supportsDirectTextReplacement(element)) {
    toast(
      isGoogleDocsEditorSurface(element)
        ? "Use the selection button to add Google Docs text to custom terms."
        : "Selection replace is disabled here to preserve formatting."
    );
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
    const result = isGoogleDocsEditorSurface(activeEditable)
      ? protectCurrentDocsSelection(selectedText, (value) => protectOnlyExactTerm(value, value))
      : protectSelectedTermAcrossField(selectedText);
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
  observeAiComposer(target);
  rememberTextCueRect(target.getBoundingClientRect());
  scheduleAnalyzeElement(target, 60);
}

function handleInput(event) {
  const target = resolveEditableElement(event.target) || resolveAutoProtectTarget();
  if (!target) {
    return;
  }

  activeEditable = target;
  observeAiComposer(target);
  rememberTextCueRect(target.getBoundingClientRect());
  scheduleAnalyzeElement(target, 120);
  scheduleAutoProtectAiPrompt(target);
}

function handlePaste(event) {
  const target = resolveEditableElement(event.target) || resolveAutoProtectTarget();
  if (!target || !ledebeSettings.scanOnPaste) {
    return;
  }

  activeEditable = target;
  observeAiComposer(target);
  rememberTextCueRect(target.getBoundingClientRect());
  window.setTimeout(() => scheduleAnalyzeElement(target, 80), 10);
  window.setTimeout(() => scheduleAutoProtectAiPrompt(target, 420), 10);
}

function handleFocusOut(event) {
  const target = resolveEditableElement(event.target);
    if (!target || target !== activeEditable) {
    return;
  }

  if (autoProtectAiTimer) {
    clearTimeout(autoProtectAiTimer);
    autoProtectAiTimer = null;
  }

  if (isAiAssistantHost()) {
    stopAiComposerObserver();
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
    scheduleAnalyzeElement(target, 80);
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

function handleKeyDown(event) {
  if (!isAiAssistantHost() || event.defaultPrevented || event.isComposing) {
    return;
  }

  if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const target = resolveEditableElement(event.target) || activeEditable;
  if (!target) {
    return;
  }

  activeEditable = target;
  autoProtectAiPromptIfNeeded(target);
}

function handlePointerDown(event) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (target instanceof HTMLElement && isAiSendTrigger(target)) {
    const editable = activeEditable || resolveEditableElement(document.activeElement);
    if (editable) {
      activeEditable = editable;
      autoProtectAiPromptIfNeeded(editable);
    }
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
  if (!form || isPausedForHost()) {
    return;
  }

  if (isAiAssistantHost() && ledebeSettings.autoProtectAiPrompts) {
    const aiField = activeEditable && form.contains(activeEditable)
      ? activeEditable
      : Array.from(form.querySelectorAll("textarea, input, [contenteditable='true'], [role='textbox']"))
        .find((field) => isEditableElement(field));

    if (aiField) {
      activeEditable = aiField;
      autoProtectAiPromptIfNeeded(aiField);
      return;
    }
  }

  if (!ledebeSettings.safeSend) {
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

// ---------------------------------------------------------------------------
// AI response restoration
// Reads assistant output (ChatGPT, Claude, Gemini, Perplexity, etc.), finds our
// placeholders, and reveals the original values. Provider-agnostic: we watch for
// known tokens appearing anywhere in non-editable page text, debounce until the
// stream settles, then restore in place. No new permissions required.
// ---------------------------------------------------------------------------

const RESPONSE_SETTLE_MS = 350;
const RESPONSE_TOKEN_REGEX = /\[LDB_[A-Z0-9_]+\]/g;
// Containers that hold the AI's reply, across the major chat UIs.
const AI_ASSISTANT_SELECTORS =
  '[data-message-author-role="assistant"], [data-message-author="assistant"], '
  + '.model-response-text, message-content, [data-testid="model-response"], '
  + 'div.agent-turn, .markdown.prose';
// Anything the page tags with a turn role means it's a chat UI where we must
// restore ONLY inside assistant turns (never the user's echoed prompt).
const TURN_ROLE_MARKERS =
  '[data-message-author-role], [data-message-author], message-content, .model-response-text';
const LATEST_RESTORED_KEY = "ledebeLatestRestored";
const responseDirtyRoots = new Set();
let responseSettleTimer = null;
let responseObserver = null;
let isApplyingResponseRestore = false;
let lastRestoredContainer = null;
let responsePanel = null;
let cachedUsesTurnRoles = null;
let lastAutoOpenedResponseContainer = null;
let lastAutoOpenedResponseText = "";

function usesNativeSidePanel() {
  return ledebeSettings.trayMode !== "inpage";
}

// Publish the restored answer to session storage. The native side panel reads
// this key (and watches it via storage.onChanged), so the answer is there
// whenever the user opens the tray — no live connection required.
function publishRestoredToSidePanel(text) {
  void safeSessionStorageSet({
    [LATEST_RESTORED_KEY]: { host: getHost(), text, ts: Date.now() }
  });
}

// Whether this page labels conversation turns (ChatGPT/Claude/Gemini/etc).
// Cached per restore pass to avoid a querySelector on every text node.
function pageUsesTurnRoles() {
  if (cachedUsesTurnRoles === null) {
    cachedUsesTurnRoles = Boolean(document.querySelector(TURN_ROLE_MARKERS));
  }
  return cachedUsesTurnRoles;
}

function isResponseRestoreActive() {
  return Boolean(
    ledebeSettings.enabled
    && ledebeSettings.restoreResponses
    && !isPausedForHost()
    && isTopLevelFrame()
    && sessionPlaceholderMap.size > 0
    && document.body
  );
}

function isResponseExcludedRegion(node) {
  const el = node instanceof HTMLElement ? node : node?.parentElement;
  if (!el) {
    return true;
  }
  if (isInsideLedebeUi(el)) {
    return true;
  }
  if (el.closest(".ledebe-restored, .ledebe-copy-pill, .ledebe-response-panel, .ledebe-toast, .ledebe-restore-cta")) {
    return true;
  }
  // Never touch editable surfaces — those are protected/restored elsewhere.
  if (el.closest('input, textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"]')) {
    return true;
  }
  // On a chat UI that labels turns, restore ONLY inside the AI's reply — never
  // the user's echoed prompt, the sidebar, or other page chrome. This is an
  // allowlist, so it's robust to whatever markup the user bubble happens to use.
  if (pageUsesTurnRoles() && !el.closest(AI_ASSISTANT_SELECTORS)) {
    return true;
  }
  return false;
}

function resolveResponseContainer(node) {
  const start = node instanceof HTMLElement ? node : node?.parentElement;
  if (!start) {
    return null;
  }

  const semantic = start.closest(
    '[data-message-author-role], .model-response-text, message-content, .model-response, '
    + '[data-testid="conversation-turn"], article, .prose'
  );
  const chosen = semantic || start.closest("p, li, blockquote, section, div");

  // Never treat the page root as a "message" — that would attribute the copy
  // pill / panel to the entire document (e.g. during the initial body sweep).
  if (!chosen || chosen === document.body || chosen === document.documentElement) {
    return start === document.body || start === document.documentElement ? null : start;
  }
  return chosen;
}

function buildRestoredSpan(token, original) {
  const span = document.createElement("span");
  span.dataset.ledebeToken = token;

  if (ledebeSettings.revealMode === "hover") {
    span.className = "ledebe-restored ledebe-restored-hover";
    const placeholder = document.createElement("span");
    placeholder.className = "ledebe-restored-ph";
    placeholder.textContent = token;
    const real = document.createElement("span");
    real.className = "ledebe-restored-real";
    real.textContent = original;
    span.append(placeholder, real);
    return span;
  }

  // inline (default) and panel modes both reveal the value in place
  span.className = "ledebe-restored ledebe-restored-inline";
  span.textContent = original;
  span.title = `Ledebe restored — original placeholder ${token}`;
  return span;
}

function restoreTokensInTextNode(node, createdSpans) {
  const text = node.textContent;
  if (!text || text.indexOf("[LDB_") === -1) {
    return;
  }

  RESPONSE_TOKEN_REGEX.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  const spans = [];
  let lastIndex = 0;
  let match;

  while ((match = RESPONSE_TOKEN_REGEX.exec(text)) !== null) {
    const token = match[0];
    const original = sessionPlaceholderMap.get(token);
    if (original === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const span = buildRestoredSpan(token, original);
    fragment.appendChild(span);
    spans.push(span);
    lastIndex = match.index + token.length;
  }

  if (spans.length === 0) {
    return;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  node.parentNode?.replaceChild(fragment, node);
  for (const span of spans) {
    createdSpans.push(span);
  }
}

function restoreResponseRoot(root, createdSpans) {
  if (!(root instanceof HTMLElement) || !root.isConnected || isResponseExcludedRegion(root)) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent || node.textContent.indexOf("[LDB_") === -1) {
        return NodeFilter.FILTER_REJECT;
      }
      if (isResponseExcludedRegion(node.parentElement)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const targets = [];
  let current = walker.nextNode();
  while (current) {
    targets.push(current);
    current = walker.nextNode();
  }

  for (const node of targets) {
    restoreTokensInTextNode(node, createdSpans);
  }
}

function getRestoredTextFromContainer(container) {
  if (!(container instanceof HTMLElement)) {
    return "";
  }
  const clone = container.cloneNode(true);
  clone.querySelectorAll(".ledebe-copy-pill, .ledebe-restored-ph, .ledebe-restore-cta").forEach((node) => node.remove());
  const text = clone.innerText || clone.textContent || "";
  return restoreKnownPlaceholdersInText(text).restored;
}

async function copyRestoredText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied restored answer to clipboard.");
  } catch (error) {
    toast("Could not copy — your browser blocked clipboard access.");
  }
}

function ensureCopyPill(container) {
  if (!(container instanceof HTMLElement) || container.dataset.ledebeCopyPill === "1") {
    return;
  }
  container.dataset.ledebeCopyPill = "1";
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "ledebe-copy-pill";
  pill.setAttribute("aria-label", "Copy restored answer");
  // Label is set via CSS ::before so it never leaks into the page's own
  // innerText / selection-based copy of the restored answer.
  pill.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    copyRestoredText(getRestoredTextFromContainer(container));
  });
  container.appendChild(pill);
}

function ensureResponsePanel() {
  if (responsePanel) {
    return responsePanel;
  }
  responsePanel = document.createElement("div");
  responsePanel.className = "ledebe-response-panel";
  responsePanel.innerHTML = `
    <div class="ledebe-response-panel-head">
      <span class="ledebe-response-panel-title">Ledebe · Restored answer</span>
      <div class="ledebe-response-panel-actions">
        <button type="button" class="ledebe-response-copy">Copy</button>
        <button type="button" class="ledebe-response-close" aria-label="Close">×</button>
      </div>
    </div>
    <pre class="ledebe-response-panel-body"></pre>
  `;
  document.documentElement.appendChild(responsePanel);

  responsePanel.querySelector(".ledebe-response-close").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    closeInPageTray();
  });
  responsePanel.querySelector(".ledebe-response-copy").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const body = responsePanel.querySelector(".ledebe-response-panel-body");
    copyRestoredText(body.textContent || "");
  });
  return responsePanel;
}

// Slide the in-page tray in and push the page content aside (QuillBot-style),
// so the answer never covers the page.
function openInPageTray() {
  const panel = ensureResponsePanel();
  panel.classList.add("is-open");
  if (isTopLevelFrame()) {
    document.documentElement.classList.add("ledebe-tray-pushed");
  }
}

function closeInPageTray() {
  if (responsePanel) {
    responsePanel.classList.remove("is-open");
  }
  document.documentElement.classList.remove("ledebe-tray-pushed");
}

function updateResponsePanel(container, restoredText) {
  const panel = ensureResponsePanel();
  const body = panel.querySelector(".ledebe-response-panel-body");
  body.textContent = restoredText != null ? restoredText : getRestoredTextFromContainer(container);
  openInPageTray();
}

// Open the restored-answer side panel from an in-page click (reliable gesture).
// Finds the most recent AI reply with known placeholders, publishes it, and
// asks the background to open the panel.
function openRestoredAnswerTray() {
  cachedUsesTurnRoles = null;
  let latest = null;
  const scope = pageUsesTurnRoles()
    ? document.querySelectorAll(AI_ASSISTANT_SELECTORS)
    : [document.body];
  for (const el of scope) {
    if (el instanceof HTMLElement && !isResponseExcludedRegion(el)
        && hasKnownPlaceholdersInText(el.innerText || el.textContent || "")) {
      latest = el;
    }
  }
  if (latest) {
    publishRestoredToSidePanel(getRestoredTextFromContainer(latest));
  }
  try {
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  } catch (error) {
    // extension context gone — ignore
  }
}

function maybeAutoOpenRestoredAnswerTray(container, restoredText) {
  if (!usesNativeSidePanel() || !ledebeSettings.autoOpenRestoredAnswers) {
    return;
  }

  if (!(container instanceof HTMLElement) || !restoredText?.trim()) {
    return;
  }

  if (container === lastAutoOpenedResponseContainer && restoredText === lastAutoOpenedResponseText) {
    return;
  }

  lastAutoOpenedResponseContainer = container;
  lastAutoOpenedResponseText = restoredText;

  try {
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  } catch (error) {
    // extension context gone — ignore
  }
}

function resetAutoOpenedResponseState() {
  lastAutoOpenedResponseContainer = null;
  lastAutoOpenedResponseText = "";
}

// Inject a QuillBot-style button under an AI reply that has restorable
// placeholders. Clicking it publishes that reply's restored text and opens the
// native side panel. Re-injected on re-render (keyed off the element, not a flag).
function ensureRestoreButton(container) {
  if (!(container instanceof HTMLElement) || container.querySelector(":scope > .ledebe-restore-cta")) {
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "ledebe-restore-cta";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ledebe-restore-cta-btn";
  btn.textContent = "Show restored answer";
  btn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    publishRestoredToSidePanel(getRestoredTextFromContainer(container));
    try {
      chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
    } catch (error) {
      // extension context gone — ignore
    }
  });
  wrap.appendChild(btn);
  container.appendChild(wrap);
}

function processDirtyResponseRoots() {
  responseSettleTimer = null;
  cachedUsesTurnRoles = null; // recompute once for this pass
  if (!isResponseRestoreActive()) {
    responseDirtyRoots.clear();
    return;
  }

  const roots = Array.from(responseDirtyRoots);
  responseDirtyRoots.clear();

  // Panel mode is read-only: never mutate the response DOM. Find AI replies that
  // contain any of our placeholders, attach a button under each (QuillBot-style),
  // and auto-mirror the most recent restorable one into the tray.
  if (ledebeSettings.revealMode === "panel") {
    const ctaContainers = new Set();
    let knownTarget = null;
    for (const root of roots) {
      if (!(root instanceof HTMLElement) || !root.isConnected || isResponseExcludedRegion(root)) {
        continue;
      }
      const text = root.innerText || root.textContent || "";
      if (text.indexOf("[LDB_") === -1) {
        continue;
      }
      const container = resolveResponseContainer(root);
      if (!container) {
        continue;
      }
      ctaContainers.add(container); // any placeholder → offer the button
      if (hasKnownPlaceholdersInText(text)) {
        knownTarget = container; // known mapping → can auto-populate
      }
    }

    if (usesNativeSidePanel()) {
      for (const container of ctaContainers) {
        ensureRestoreButton(container);
      }
    }

    if (knownTarget) {
      lastRestoredContainer = knownTarget;
      const restoredText = getRestoredTextFromContainer(knownTarget);
      if (usesNativeSidePanel()) {
        publishRestoredToSidePanel(restoredText);
        maybeAutoOpenRestoredAnswerTray(knownTarget, restoredText);
      } else {
        updateResponsePanel(knownTarget, restoredText);
      }
    }
    return;
  }

  isApplyingResponseRestore = true;
  const createdSpans = [];
  try {
    for (const root of roots) {
      restoreResponseRoot(root, createdSpans);
    }
  } finally {
    isApplyingResponseRestore = false;
  }

  // Attribute touched containers from the actual restored spans (not the sweep
  // root) so a broad body sweep never mislabels the whole page as one message.
  const touched = new Set();
  for (const span of createdSpans) {
    const container = resolveResponseContainer(span);
    if (container) {
      touched.add(container);
    }
  }

  for (const container of touched) {
    lastRestoredContainer = container;
    ensureCopyPill(container);
  }
}

function queueResponseRoot(root) {
  if (!(root instanceof HTMLElement) || isResponseExcludedRegion(root)) {
    return false;
  }
  responseDirtyRoots.add(root);
  return true;
}

function handleResponseMutations(records) {
  if (isApplyingResponseRestore || !isResponseRestoreActive()) {
    return;
  }

  let queued = false;
  for (const record of records) {
    if (record.type === "characterData") {
      const target = record.target;
      if (target?.textContent?.indexOf("[LDB_") !== -1) {
        queued = queueResponseRoot(target.parentElement) || queued;
      }
      continue;
    }

    for (const node of record.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.indexOf("[LDB_") !== -1) {
          queued = queueResponseRoot(node.parentElement) || queued;
        }
      } else if (node instanceof HTMLElement && node.textContent?.indexOf("[LDB_") !== -1) {
        queued = queueResponseRoot(node) || queued;
      }
    }
  }

  if (queued) {
    if (responseSettleTimer) {
      clearTimeout(responseSettleTimer);
    }
    responseSettleTimer = setTimeout(processDirtyResponseRoots, RESPONSE_SETTLE_MS);
  }
}

function sweepResponses() {
  if (!isResponseRestoreActive()) {
    return;
  }
  cachedUsesTurnRoles = null;

  let queued = false;
  if (pageUsesTurnRoles()) {
    // Chat UI: only sweep assistant turns, never the whole page.
    for (const el of document.querySelectorAll(AI_ASSISTANT_SELECTORS)) {
      queued = queueResponseRoot(el) || queued;
    }
  } else {
    queued = queueResponseRoot(document.body);
  }

  if (!queued) {
    return;
  }
  if (responseSettleTimer) {
    clearTimeout(responseSettleTimer);
  }
  responseSettleTimer = setTimeout(processDirtyResponseRoots, RESPONSE_SETTLE_MS);
}

function startResponseObserver() {
  if (responseObserver || !isTopLevelFrame() || !document.body) {
    return;
  }
  responseObserver = new MutationObserver(handleResponseMutations);
  responseObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
  // Chat SPAs (ChatGPT, etc.) render the conversation asynchronously after load,
  // sometimes before the observer attaches. Re-sweep a few times so an already-
  // rendered reply with our placeholders still gets restored after a refresh.
  sweepResponses();
  setTimeout(sweepResponses, 1200);
  setTimeout(sweepResponses, 3000);
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
    // The mapping lives in whichever area is currently active (local/session).
    if ((areaName === "local" || areaName === "session") && changes[PLACEHOLDER_STORAGE_KEY]) {
      if (areaName === mappingAreaName()) {
        replaceSessionPlaceholderMap(changes[PLACEHOLDER_STORAGE_KEY].newValue || {});
        // New placeholders may unlock restorations in already-rendered answers.
        sweepResponses();
      }
      return;
    }

    if (areaName !== "sync") {
      return;
    }

    const hadPersistChange = Object.prototype.hasOwnProperty.call(changes, "persistMappings");

    for (const [key, value] of Object.entries(changes)) {
      ledebeSettings[key] = value.newValue;
    }

    if (hadPersistChange) {
      migratePlaceholderStore();
    }

    if (assistantOpen) {
      renderAssistantPanel();
    }

    if (activeEditable) {
      analyzeElement(activeEditable);
    }

    if (changes.restoreResponses || changes.revealMode || changes.enabled || changes.pausedHosts || changes.trayMode || changes.autoOpenRestoredAnswers) {
      if (changes.revealMode || changes.trayMode || changes.autoOpenRestoredAnswers || changes.restoreResponses) {
        resetAutoOpenedResponseState();
      }
      if (changes.trayMode && usesNativeSidePanel()) {
        closeInPageTray(); // switched away from the in-page tray
      }
      startResponseObserver();
      sweepResponses();
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

if (shouldInitializeInCurrentFrame()) {
  // Load settings first so the map loads from the correct store (local vs session).
  loadSettings().then(loadSessionPlaceholderMap).then(() => {
    document.addEventListener("focusin", handleFocus, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("keydown", handleKeyDown, true);
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
    startResponseObserver();
  });
}
