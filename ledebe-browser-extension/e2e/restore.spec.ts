import { test, expect, openHost, openOverlay, seedAssistantReply, S } from './helpers';

test('restore: real value shows in the panel; the page keeps the placeholder', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);

  // Grab the REAL namespaced token (the injected note also contains a literal
  // example "[LDB_EMAIL_1]", so match the namespaced "[LDB_EMAIL_<NS>_<n>]" form).
  const token = (await page.inputValue(S.ta)).match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/)![0];

  // Simulate the assistant echoing the placeholder in its reply.
  await seedAssistantReply(page, `Sure - ${token} is noted.`);

  await openOverlay(page);
  await page.click(S.tab('home'));

  // The panel reveals the real value...
  await expect(page.locator(S.msgText, { hasText: 'a@b.com' })).toBeVisible();
  // ...while the page DOM still shows the placeholder, never the real value.
  const reply = await page.locator('#reply-prose').innerText();
  expect(reply).toContain(token);
  expect(reply).not.toContain('a@b.com');
});

test('restored replies do not auto-open the drawer', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);

  const token = (await page.inputValue(S.ta)).match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/)![0];
  await seedAssistantReply(page, `Sure - ${token} is noted.`);

  await expect(page.locator(S.noticeVisible)).toBeVisible();
  await expect(page.locator(S.drawerOpen)).toHaveCount(0);
});
