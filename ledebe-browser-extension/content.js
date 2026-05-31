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
const restoreSnapshots = new WeakMap();

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

function getHost() {
  return window.location.hostname;
}

function isPausedForHost() {
  return ledebeSettings.pausedHosts.includes(getHost());
}

function isEditableElement(node) {
  if (!node || !(node instanceof HTMLElement)) {
    return false;
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

function resolveEditableElement(node) {
  let current = node instanceof HTMLElement ? node : null;

  while (current) {
    if (isInsideLedebeUi(current)) {
      return null;
    }
    if (isEditableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function getEditableText(element) {
  if (!element) {
    return "";
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value || "";
  }

  return element.innerText || element.textContent || "";
}

function setEditableText(element, value) {
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
  return;
}

function ensureSelectionButton() {
  if (selectionButton) {
    return selectionButton;
  }

  selectionButton = document.createElement("button");
  selectionButton.type = "button";
  selectionButton.className = "ledebe-selection-btn";
  selectionButton.textContent = "🛡 Protect";
  selectionButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    protectSelection();
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

function showSelectionButton(x, y) {
  const button = ensureSelectionButton();
  button.style.display = "flex";
  button.style.left = `${Math.max(8, Math.min(x - 50, window.innerWidth - 160))}px`;
  button.style.top = `${Math.max(8, y - 46)}px`;
}

function applyVisualHints(element, findings) {
  return;
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
        <span class="ledebe-fan-icon">...</span>
        <span class="ledebe-fan-label">Chat</span>
      </button>
      <button type="button" class="ledebe-fan-btn ledebe-fan-btn-protect" data-action="protect">
        <span class="ledebe-fan-icon">+</span>
        <span class="ledebe-fan-label">Protect</span>
      </button>
      <button type="button" class="ledebe-fan-btn ledebe-fan-btn-pause" data-action="pause">
        <span class="ledebe-fan-icon">||</span>
        <span class="ledebe-fan-label">Pause</span>
      </button>
    </div>
    <button type="button" class="ledebe-launcher-main" aria-label="Ledebe assistant">
      <span class="ledebe-launcher-core">
        <img src="${logoUrl}" alt="Ledebe">
      </span>
      <span class="ledebe-launcher-count" hidden>0</span>
    </button>
  `;

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
      } else if (action === "pause") {
        await togglePauseSite();
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

  const pauseLabel = launcherRoot.querySelector(".ledebe-fan-btn-pause .ledebe-fan-label");
  const pauseIcon = launcherRoot.querySelector(".ledebe-fan-btn-pause .ledebe-fan-icon");
  const protectButton = launcherRoot.querySelector(".ledebe-fan-btn-protect");
  const chatButton = launcherRoot.querySelector(".ledebe-fan-btn-chat");

  if (pauseLabel) {
    pauseLabel.textContent = paused ? "Resume" : "Pause";
  }

  if (pauseIcon) {
    pauseIcon.textContent = paused ? ">" : "||";
  }

  if (protectButton) {
    protectButton.disabled = paused;
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
  const rect = element.getBoundingClientRect();
  const verticalMid = rect.top + Math.min(rect.height / 2, 80);
  const top = Math.max(12, Math.min(window.innerHeight - 64, verticalMid - 28));

  if (!launcherAnchor || launcherAnchor.element !== element) {
    const preferredLeft = rect.right + 10;
    const fallbackLeft = rect.right - 66;
    const side = preferredLeft + 56 <= window.innerWidth ? "right" : "inside";
    const left = side === "right"
      ? preferredLeft
      : Math.max(12, Math.min(window.innerWidth - 64, fallbackLeft));

    launcherAnchor = { element, side, left };
  }

  launcher.style.top = `${top}px`;
  launcher.style.left = `${launcherAnchor.left}px`;
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
  const canRestore = restoreSnapshots.has(activeEditable);
  const findings = summarizeFindings(activeFindings);
  const customTerms = ledebeSettings.customTerms || [];
  const paused = isPausedForHost();

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
        <button type="button" class="ledebe-chat-action primary" data-action="protect-panel" ${paused ? "disabled" : ""}>Protect this field</button>
        <button type="button" class="ledebe-chat-action" data-action="restore-panel" ${canRestore ? "" : "disabled"}>Restore original text</button>
        <button type="button" class="ledebe-chat-action" data-action="pause-panel">${paused ? "Resume on this site" : "Pause on this site"}</button>
      </div>
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

function protectActiveField() {
  if (!activeEditable) {
    toast("Focus a text field first.");
    return;
  }

  const original = getEditableText(activeEditable);
  const result = protectTextValue(original);
  if (!result.replacements.length) {
    toast("Nothing sensitive found in this field.");
    return;
  }

  restoreSnapshots.set(activeEditable, original);
  setEditableText(activeEditable, result.masked);
  analyzeElement(activeEditable);
  toast(`Protected ${result.replacements.length} item${result.replacements.length === 1 ? "" : "s"}.`);
}

function restoreActiveField() {
  if (!activeEditable) {
    toast("Focus a text field first.");
    return;
  }

  const original = restoreSnapshots.get(activeEditable);
  if (typeof original !== "string") {
    toast("No Ledebe restore point for this field yet.");
    return;
  }

  setEditableText(activeEditable, original);
  restoreSnapshots.delete(activeEditable);
  analyzeElement(activeEditable);
  toast("Original text restored.");
}

function protectSelection() {
  const element = activeEditable;
  if (!element) {
    toast("Focus a text field first.");
    return;
  }

  restoreSnapshots.set(element, getEditableText(element));

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

  range.deleteContents();
  range.insertNode(document.createTextNode(result.masked));
  analyzeElement(element);
  toast(`Protected ${result.replacements.length} selected item${result.replacements.length === 1 ? "" : "s"}.`);
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
  analyzeElement(target);
}

function handleInput(event) {
  const target = resolveEditableElement(event.target);
  if (!target) {
    return;
  }

  activeEditable = target;
  analyzeElement(target);
}

function handlePaste(event) {
  const target = resolveEditableElement(event.target);
  if (!target || !ledebeSettings.scanOnPaste) {
    return;
  }

  activeEditable = target;
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

  const target = resolveEditableElement(selection.anchorNode);
  if (!target || isPausedForHost() || !ledebeSettings.enabled) {
    hideSelectionButton();
    return;
  }

  activeEditable = target;
  analyzeElement(target);

  const selectedText = selection.toString().trim();
  if (selectedText.length > 1) {
    setLauncherExpanded(true);
    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    const rect = range?.getBoundingClientRect();
    if (rect && (rect.width || rect.height)) {
      showSelectionButton(rect.left + rect.width / 2, rect.top);
    }
  } else {
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
    if (areaName !== "sync") {
      return;
    }

    for (const [key, value] of Object.entries(changes)) {
      ledebeSettings[key] = value.newValue;
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

loadSettings().then(() => {
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
