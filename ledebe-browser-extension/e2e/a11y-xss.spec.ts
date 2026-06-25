import { test, expect, openHost, openOverlay, S } from './helpers';

test('a11y: tabs are <button>s and keyboard-focusable', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);

  const tabs = page.locator(S.tabs);
  await expect(tabs).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    expect(await tabs.nth(i).evaluate((el) => el.tagName)).toBe('BUTTON');
  }
  await tabs.first().focus();
  expect(await page.evaluate(() => document.activeElement?.className || '')).toContain('ledebe-tab');

  // the injected inline icon has an accessible name
  expect(await page.locator(S.inlineBtn).first().getAttribute('aria-label')).toBeTruthy();
});

test('xss: HTML in a protected value is escaped, never executed', async ({ context }) => {
  const page = await openHost(context);
  await page.evaluate(() => { (window as any).__xss = false; });

  await openOverlay(page);
  await page.click(S.tab('words'));

  const payload = '<img src=x onerror="window.__xss=true">';
  await page.fill(S.wordsInput, payload);
  await page.click(S.wordsBtn);

  // Rendered escaped in the panel, and no onerror fired.
  await expect(page.locator(S.drawer)).toContainText('<img src=x onerror'); // shown as literal text
  const html = await page.locator(S.drawer).innerHTML();
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img src=x onerror');
  expect(await page.evaluate(() => (window as any).__xss)).toBe(false);
});
