import { test, expect, openHost, pasteInto, S } from './helpers';

test('textarea: masks a completed value as you type', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com '); // trailing space → value complete, caret past it
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  expect(await page.inputValue(S.ta)).not.toContain('a@b.com');
});

test('textarea: masks a natural sentence with a gmail address after a trailing space', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('hi my email is ade@gmail.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  expect(await page.inputValue(S.ta)).not.toContain('ade@gmail.com');
});

test('contenteditable: masks the value in place', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.pm);
  await page.keyboard.type('reach me at a@b.com please ');
  await expect.poll(() => page.locator(S.pm).innerText()).toMatch(/\[LDB_EMAIL_/);
  expect(await page.locator(S.pm).innerText()).not.toContain('a@b.com');
});

test('paste: masks pasted PII (textarea)', async ({ context }) => {
  const page = await openHost(context);
  await pasteInto(page, S.ta, 'paste a@b.com and 4111 1111 1111 1111 here');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  expect(await page.inputValue(S.ta)).not.toContain('a@b.com');
  expect(await page.inputValue(S.ta)).not.toContain('4111 1111 1111 1111');
});

test('send-flush: masks the trailing value and prepends the keep-placeholders note', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com'); // no trailing space → caret-guarded, not yet masked
  await page.click(S.send);                  // send trigger → flushBeforeSend
  await expect.poll(() => page.inputValue(S.ta)).toContain('[Ledebe note to the assistant:');
  const v = await page.inputValue(S.ta);
  expect(v).not.toContain('a@b.com');
  expect(v.indexOf('[Ledebe note to the assistant:')).toBe(0); // note is at the top
});
