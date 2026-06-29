import { test, expect, openHost, openOverlay, sendMessageToPage, S } from './helpers';

test('detection shows the notice and the full panel opens from the inline icon', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect(page.locator(S.noticeVisible)).toBeVisible();
  await sendMessageToPage(page, { type: 'OPEN_PANEL' });
  await expect(page.locator(S.drawerOpen)).toBeVisible();
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

test('OPEN_PANEL toggles the overlay closed on the second click', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect(page.locator(S.noticeVisible)).toBeVisible();

  await sendMessageToPage(page, { type: 'OPEN_PANEL' });
  await expect(page.locator(S.drawerOpen)).toBeVisible();

  await sendMessageToPage(page, { type: 'OPEN_PANEL' });
  await expect(page.locator(S.drawer)).not.toHaveClass(/is-open/);
});

test('Protected words: Unprotect reveals the value back into the field', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await openOverlay(page);
  await page.click(S.tab('field'));
  await page.locator(`${S.protectedRow}`, { hasText: 'a@b.com' }).click();
  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');
});

test('selected auto-protected placeholder toggles back to its real value', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com and c@d.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  const value = await page.inputValue(S.ta);

  const [firstToken] = value.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/g) || [];
  expect(firstToken).toBeTruthy();

  await page.evaluate(({ selector, token }) => {
    const el = document.querySelector(selector) as HTMLTextAreaElement;
    const start = el.value.indexOf(token);
    el.focus();
    el.selectionStart = start;
    el.selectionEnd = start + token.length;
  }, { selector: S.ta, token: firstToken! });

  await sendMessageToPage(page, { type: 'TOGGLE_SELECTION_PROTECTION', selectedText: firstToken! });

  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');
});

test('selected plaintext toggles into a placeholder and keeps it selected', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com now');
  await page.evaluate(({ selector }) => {
    const el = document.querySelector(selector) as HTMLTextAreaElement;
    const target = 'a@b.com';
    const start = el.value.indexOf(target);
    el.focus();
    el.selectionStart = start;
    el.selectionEnd = start + target.length;
  }, { selector: S.ta });

  await sendMessageToPage(page, { type: 'TOGGLE_SELECTION_PROTECTION', selectedText: 'a@b.com' });

  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  const selected = await page.evaluate(({ selector }) => {
    const el = document.querySelector(selector) as HTMLTextAreaElement;
    return el.value.slice(el.selectionStart, el.selectionEnd);
  }, { selector: S.ta });
  expect(selected).toMatch(/\[LDB_EMAIL_/);
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

test('selected custom-word placeholder toggles back to its real value', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await page.click(S.tab('words'));
  await page.fill(S.wordsInput, 'Falcon');
  await page.click(S.wordsBtn);
  await page.click(S.ta);
  await page.keyboard.type('project Falcon ready ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_CUSTOM_/);
  const value = await page.inputValue(S.ta);

  const [token] = value.match(/\[LDB_CUSTOM_[A-Z0-9]+_\d+\]/g) || [];
  expect(token).toBeTruthy();

  await page.evaluate(({ selector, token }) => {
    const el = document.querySelector(selector) as HTMLTextAreaElement;
    const start = el.value.indexOf(token);
    el.focus();
    el.selectionStart = start;
    el.selectionEnd = start + token.length;
  }, { selector: S.ta, token: token! });

  await sendMessageToPage(page, { type: 'TOGGLE_SELECTION_PROTECTION', selectedText: token! });

  await expect.poll(() => page.inputValue(S.ta)).toContain('Falcon');
});

test('Home tab treats ChatGPT email writing blocks as their own copyable section', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  const current = await page.inputValue(S.ta);
  const [token] = current.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/g) || [];
  expect(token).toBeTruthy();

  await page.evaluate((placeholder) => {
    const assistant = document.querySelector('#assistant');
    if (!assistant) throw new Error('Assistant turn missing');
    assistant.innerHTML = `
      <div class="markdown prose">
        <p>Here's a sample email with a realistic address:</p>
        <div class="writing-block-editor">
          <div
            class="ProseMirror markdown prose"
            data-writing-block-fullscreen-editor-region="true"
            contenteditable="true"
          >
            <p>Subject: Welcome</p>
            <p>From: Sarah Johnson &lt;${placeholder}&gt;</p>
            <p>To: Alex Carter &lt;${placeholder}&gt;</p>
          </div>
        </div>
      </div>
      <div class="action-row">
        <button data-testid="copy-turn-action-button" aria-label="Copy">Copy</button>
      </div>
    `;
  }, token!);

  await openOverlay(page);
  await page.click(S.tab('home'));

  await expect(page.locator('.ledebe-msg__block')).toHaveCount(2);
  await expect(page.locator('.ledebe-msg__block.is-code')).toContainText('From: Sarah Johnson <a@b.com>');
  await expect(page.locator(S.msgCopy)).toHaveCount(2);
});

test('drawer shows the privacy note and selection toggle actions', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('field'));
  await expect(page.locator('.ledebe-drawer__privacy-badge')).toContainText('Your data never leaves your device.');
  await expect(page.getByRole('button', { name: 'Toggle selected text' })).toBeVisible();
});

test('drawer settings matches native settings for company join and feedback', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await expect(page.getByText('Company sync')).toBeVisible();
  await expect(page.getByPlaceholder('Company join code')).toBeVisible();
  await expect(page.getByPlaceholder('Work email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join company' })).toBeVisible();
  await expect(page.locator('.ledebe-drawer__section', { hasText: 'Feedback' })).toBeVisible();
  await expect(page.getByPlaceholder('Describe what happened...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send feedback' })).toBeVisible();
});

test('protected content stays passive until the user clicks the icon', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await expect(page.locator(S.noticeVisible)).toBeVisible();
  await expect(page.locator(S.drawerOpen)).toHaveCount(0);
});

test('manual protect keeps the drawer closed and only shows the compact notice', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com');
  await expect(page.locator(S.noticeVisible)).not.toBeVisible();

  await sendMessageToPage(page, { type: 'PROTECT_ACTIVE_FIELD' });

  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await expect(page.locator(S.noticeVisible)).toBeVisible();
  await expect(page.locator(S.drawerOpen)).toHaveCount(0);
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
