import { test, expect, openHost, openOverlay, S } from './helpers';

test('per-host isolation: one site never shows another site\'s protected values', async ({ context }) => {
  // Protect on chatgpt.com
  const chatgpt = await openHost(context, 'chatgpt.com');
  await chatgpt.click(S.ta);
  await chatgpt.keyboard.type('email a@b.com ');
  await expect.poll(() => chatgpt.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);

  // Protect something else on claude.ai
  const claude = await openHost(context, 'claude.ai');
  await claude.click(S.ta);
  await claude.keyboard.type('email z@z.com ');
  await expect.poll(() => claude.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);

  // Claude's panel shows its own value, not chatgpt's.
  await openOverlay(claude);
  await claude.click(S.tab('field'));
  await expect(claude.locator(S.drawer)).toContainText('z@z.com');
  await expect(claude.locator(S.drawer)).not.toContainText('a@b.com');
});
