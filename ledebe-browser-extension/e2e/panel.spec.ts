import { test, expect, openHost, openOverlay, S } from './helpers';

test('overlay auto-opens on detection with the four tabs', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await expect(page.locator(S.tabs)).toHaveCount(4);
  for (const t of ['home', 'words', 'field', 'settings']) {
    await expect(page.locator(S.tab(t))).toBeVisible();
  }
});

test('in-page icon closes the overlay when it is already open', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await expect(page.locator(S.inlineBtn)).toBeVisible(); // injected next to the copy button
  await page.click(S.inlineBtn);
  await expect(page.locator(S.drawer)).not.toHaveClass(/is-open/);
});

test('Protected words: Unprotect reveals the value back into the field', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await page.click(S.tab('field'));
  await page.locator(`${S.protectedRow}`, { hasText: 'a@b.com' }).click();
  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');
});

test('Custom words: adding a term masks it immediately', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await page.click(S.tab('words'));
  await page.fill(S.wordsInput, 'Falcon');
  await page.click(S.wordsBtn);
  await expect(page.locator(S.row, { hasText: 'Falcon' })).toBeVisible();
  await page.click(S.ta);
  await page.keyboard.type('project Falcon ok ');
  await expect.poll(() => page.inputValue(S.ta)).not.toContain('Falcon');
});

test('Settings: turning Numbers off stops number masking', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await page.click(S.advancedSummary);
  await page.locator(S.toggle, { hasText: 'Numbers' }).locator('input[type=checkbox]').uncheck();
  await page.click(S.ta);
  await page.keyboard.type('code 12345 done ');
  await page.waitForTimeout(400);
  expect(await page.inputValue(S.ta)).toContain('12345');
});
