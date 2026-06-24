import { test as base, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const EXT_DIR = path.resolve(__dirname, '..');        // ledebe-browser-extension/
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixture', 'ai-page.html'), 'utf8');

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
    route.fulfill({ contentType: 'text/html', body: FIXTURE }));
  await page.goto(`https://${host}/c/test`);
  await page.waitForSelector('#ta');
  return page;
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

export const S = {
  ta: '#ta',
  pm: '#pm',
  send: '#send',
  drawer: '.ledebe-drawer',
  drawerOpen: '.ledebe-drawer.is-open',
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
