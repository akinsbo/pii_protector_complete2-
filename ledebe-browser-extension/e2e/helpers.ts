import { test as base, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const EXT_DIR = path.resolve(__dirname, '..');        // ledebe-browser-extension/
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixture', 'ai-page.html'), 'utf8');

function assistantMarkup(host: string) {
  if (host.includes('claude')) {
    return `
      <div id="claude-user" data-testid="user-message"><div id="reply-user">User turn</div></div>
      <div id="claude-assistant" data-testid="assistant-message">
        <div class="font-claude-message">
          <p id="reply-prose">Awaiting reply…</p>
        </div>
        <div class="action-row">
          <button data-testid="copy-turn-action-button" aria-label="Copy">Copy</button>
        </div>
      </div>
    `;
  }

  if (host.includes('gemini')) {
    return `
      <user-query id="gemini-user">
        <div id="reply-user">User turn</div>
      </user-query>
      <model-response id="gemini-assistant">
        <message-content>
          <div class="model-response-text">
            <p id="reply-prose">Awaiting reply…</p>
          </div>
        </message-content>
        <div class="action-row">
          <button data-testid="copy-turn-action-button" aria-label="Copy">Copy</button>
        </div>
      </model-response>
    `;
  }

  return `
    <div id="assistant" data-message-author-role="assistant">
      <div class="markdown prose">
        <p id="reply-prose">Awaiting reply…</p>
      </div>
      <div class="action-row">
        <button data-testid="copy-turn-action-button" aria-label="Copy">Copy</button>
      </div>
    </div>
  `;
}

function buildFixture(host: string) {
  return FIXTURE.replace(
    /<div id="thread">[\s\S]*<\/div>\s*<\/body>/,
    `<div id="thread">${assistantMarkup(host)}</div>\n</body>`
  );
}

// A fresh persistent context (with the unpacked extension) per test → isolation.
export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium', // Chromium "new headless" supports MV3 extensions
      args: [
        `--disable-extensions-except=${EXT_DIR}`,
        `--load-extension=${EXT_DIR}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    await use(new URL(sw.url()).host);
  },
});

export { expect };

// Serve the local fixture as if it were a real AI host, so isAiHost() is true and
// the content script's auto-masking actually runs.
export async function openHost(context: BrowserContext, host = 'chatgpt.com'): Promise<Page> {
  const page = await context.newPage();
  await page.route(`https://${host}/**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: buildFixture(host) }));
  await page.goto(`https://${host}/c/test`);
  await page.waitForSelector('#ta');
  return page;
}

// Trigger the content-script notice via the normal detection path, then open
// the full panel from the inline Ledebe icon the same way a user would.
export async function openOverlay(page: Page): Promise<void> {
  if (!(await page.locator(S.noticeVisible).isVisible().catch(() => false))) {
    await page.click(S.ta);
    await page.keyboard.type('email a@b.com ');
    await expect(page.locator(S.noticeVisible)).toBeVisible();
  }
  await expect(page.locator(S.inlineBtn).first()).toBeVisible();
  await sendMessageToPage(page, { type: 'OPEN_PANEL' });
  await expect(page.locator(S.drawerOpen)).toBeVisible();
}

// Simulate a paste of `text` into a plain field (sets value then fires `paste`).
export async function pasteInto(page: Page, selector: string, text: string) {
  await page.evaluate(({ selector, text }) => {
    const el = document.querySelector(selector) as HTMLTextAreaElement;
    el.focus();
    el.value = text;
    el.selectionStart = el.selectionEnd = text.length;
    el.dispatchEvent(new Event('paste', { bubbles: true }));
  }, { selector, text });
}

export async function seedAssistantReply(page: Page, text: string) {
  await page.locator('#reply-prose').evaluate((node, value) => {
    node.textContent = value;
  }, text);
}

export async function sendMessageToPage(page: Page, message: Record<string, unknown>) {
  const sw = page.context().serviceWorkers()[0];
  if (!sw) throw new Error('Extension service worker not available');
  await sw.evaluate(async ({ pageUrl, message }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) throw new Error(`No tab found for ${pageUrl}`);
    await chrome.tabs.sendMessage(tab.id, message);
  }, { pageUrl: page.url(), message });
}

export const S = {
  ta: '#ta',
  pm: '#pm',
  send: '#send',
  drawer: '.ledebe-drawer',
  drawerOpen: '.ledebe-drawer.is-open',
  notice: '.ledebe-notice',
  noticeVisible: '.ledebe-notice.is-visible',
  tab: (t: string) => `.ledebe-tab[data-tab="${t}"]`,
  tabs: '.ledebe-tab',
  inlineBtn: '.ledebe-inline-btn',
  row: '.ledebe-row',
  protectedRow: '.ledebe-row--protected',
  wordsInput: '.ledebe-words__input',
  wordsBtn: '.ledebe-words__btn',
  msgText: '.ledebe-msg__text',
  msgCopy: '.ledebe-msg__copy',
  advancedSummary: '.ledebe-advanced > summary',
  toggle: '.ledebe-toggle',
};
