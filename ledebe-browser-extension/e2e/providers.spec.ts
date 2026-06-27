import { test, expect, openHost, openOverlay, seedAssistantReply, S } from './helpers';

const HOSTS = ['chatgpt.com', 'claude.ai', 'gemini.google.com'];

for (const host of HOSTS) {
  test(`restore works on ${host}`, async ({ context }) => {
    const page = await openHost(context, host);
    await page.click(S.ta);
    await page.keyboard.type('email a@b.com ');
    await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);

    const token = (await page.inputValue(S.ta)).match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/)?.[0];
    expect(token).toBeTruthy();

    await seedAssistantReply(page, `Provider echo ${token}`);

    await openOverlay(page);
    await page.click(S.tab('home'));

    await expect(page.locator(S.msgText, { hasText: 'a@b.com' })).toBeVisible();
    await expect(page.locator('#reply-prose')).toContainText(token!);
    await expect(page.locator('#reply-prose')).not.toContainText('a@b.com');
  });
}
