import { test, expect, openHost, openOverlay, seedAssistantReply, sendMessageToPage, S } from './helpers';

test('detection shows the notice and the full panel opens from the inline icon', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
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

test('selected plaintext toggles into a placeholder', async ({ context }) => {
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
});

test('Protect selected text action protects only the highlighted word', async ({ context }) => {
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

  await sendMessageToPage(page, { type: 'PROTECT_SELECTION', selectedText: 'a@b.com' });

  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
});

test('mild mode leaves ordinals like 1st unprotected by default', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('she finished 1st and he placed 4th ');
  await expect.poll(() => page.inputValue(S.ta)).toContain('1st');
  await expect.poll(() => page.inputValue(S.ta)).toContain('4th');
});

for (const host of ['chatgpt.com', 'claude.ai', 'gemini.google.com']) {
  test(`selection popup protects and reveals the selected text on ${host}`, async ({ context }) => {
    const page = await openHost(context, host);
    const composer = host.includes('gemini') ? S.pm : S.ta;
    const readValue = async () => host.includes('gemini') ? page.locator(S.pm).innerText() : page.inputValue(S.ta);

    await page.click(composer);
    if (host.includes('gemini')) {
      await page.keyboard.type('email a@b.com now');
      await page.evaluate(({ selector }) => {
        const el = document.querySelector(selector) as HTMLElement;
        const target = 'a@b.com';
        const text = el.innerText;
        const start = text.indexOf(target);
        const end = start + target.length;
        const range = document.createRange();
        const selection = window.getSelection();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const nextOffset = offset + node.textContent!.length;
          if (!startNode && start >= offset && start <= nextOffset) {
            startNode = node;
            startOffset = start - offset;
          }
          if (!endNode && end >= offset && end <= nextOffset) {
            endNode = node;
            endOffset = end - offset;
            break;
          }
          offset = nextOffset;
        }
        if (!startNode || !endNode || !selection) throw new Error('Failed to select Gemini text');
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
        el.focus();
        document.dispatchEvent(new Event('selectionchange'));
      }, { selector: S.pm });
    } else {
      await page.keyboard.type('email a@b.com now');
      await page.evaluate(({ selector }) => {
        const el = document.querySelector(selector) as HTMLTextAreaElement;
        const target = 'a@b.com';
        const start = el.value.indexOf(target);
        el.focus();
        el.selectionStart = start;
        el.selectionEnd = start + target.length;
        document.dispatchEvent(new Event('selectionchange'));
      }, { selector: S.ta });
    }

    await expect(page.locator(S.selectionPopup)).toBeVisible();
    await page.locator(`${S.selectionPopup} .ledebe-selection-popup__action`).evaluate((node: HTMLButtonElement) => node.click());
    await expect.poll(readValue).toMatch(/\[LDB_EMAIL_/);

    const protectedValue = await readValue();
    const [token] = protectedValue.match(/\[LDB_EMAIL_[A-Z0-9]+_\d+\]/g) || [];
    expect(token).toBeTruthy();

    if (host.includes('gemini')) {
      await page.evaluate(({ selector, token }) => {
        const el = document.querySelector(selector) as HTMLElement;
        const text = el.innerText;
        const start = text.indexOf(token);
        const end = start + token.length;
        const range = document.createRange();
        const selection = window.getSelection();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const nextOffset = offset + node.textContent!.length;
          if (!startNode && start >= offset && start <= nextOffset) {
            startNode = node;
            startOffset = start - offset;
          }
          if (!endNode && end >= offset && end <= nextOffset) {
            endNode = node;
            endOffset = end - offset;
            break;
          }
          offset = nextOffset;
        }
        if (!startNode || !endNode || !selection) throw new Error('Failed to select Gemini token');
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        selection.removeAllRanges();
        selection.addRange(range);
        el.focus();
        document.dispatchEvent(new Event('selectionchange'));
      }, { selector: S.pm, token: token! });
    } else {
      await page.evaluate(({ selector, token }) => {
        const el = document.querySelector(selector) as HTMLTextAreaElement;
        const start = el.value.indexOf(token);
        el.focus();
        el.selectionStart = start;
        el.selectionEnd = start + token.length;
        document.dispatchEvent(new Event('selectionchange'));
      }, { selector: S.ta, token: token! });
    }

    await expect(page.locator(S.selectionPopup)).toBeVisible();
    await page.locator(`${S.selectionPopup} .ledebe-selection-popup__action`).evaluate((node: HTMLButtonElement) => node.click());
    await expect.poll(readValue).toContain('a@b.com');
  });
}

test('composer square cycles mild, aggressive, off, then back to mild', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await expect(page.locator(S.composerToggle)).toBeVisible();
  await expect(page.locator(S.composerToggle)).toHaveClass(/is-mild/);
  await expect(page.locator(S.composerToggle)).toHaveAttribute('title', /switch protection to aggressive mode/i);
  await page.click(S.composerToggle);
  await expect(page.locator(S.composerToggle)).toHaveClass(/is-aggressive/);
  await expect(page.locator(S.composerToggle)).toHaveAttribute('title', /turn protection off/i);
  await page.click(S.composerToggle);
  await expect(page.locator(S.composerToggle)).toHaveClass(/is-paused/);
  await expect(page.locator(S.composerToggle)).toHaveAttribute('title', /turn protection on in mild mode/i);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');
  await page.click(S.composerToggle);
  await expect(page.locator(S.composerToggle)).toHaveClass(/is-mild/);
});

for (const host of ['claude.ai', 'gemini.google.com']) {
  test(`composer status dot appears on ${host}`, async ({ context }) => {
    const page = await openHost(context, host);
    const composer = host.includes('gemini') ? S.pm : S.ta;
    await page.click(composer);
    await expect(page.locator(S.composerToggle)).toBeVisible();
  });
}

test('Gemini rich composer masks content inside the contenteditable textbox', async ({ context }) => {
  const page = await openHost(context, 'gemini.google.com');
  await page.click(S.pm);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.locator(S.pm).innerText()).toMatch(/\[LDB_EMAIL_/);
});

test('aggressive mode masks generic numbers only from 5 digits upward', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await page.locator('.ledebe-mode-option', { hasText: 'Aggressive' }).click();
  await page.click(S.ta);
  await expect(page.locator(S.composerToggle)).toHaveClass(/is-aggressive/);

  await page.keyboard.type('codes 1234 and 12345 ');

  await expect.poll(() => page.inputValue(S.ta)).toContain('1234');
  await expect.poll(() => page.inputValue(S.ta)).not.toContain('12345');
});

test('choosing aggressive mode resumes protection for a paused site', async ({ context }) => {
  const page = await openHost(context, 'gemini.google.com');
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await page.getByRole('button', { name: 'Pause on this site' }).click();
  await expect(page.getByText('Choosing Mild or Aggressive will turn it back on.')).toBeVisible();
  await page.locator('.ledebe-mode-option', { hasText: 'Aggressive' }).click();

  await page.click(S.pm);
  await page.keyboard.type('Blessing David ');
  await expect.poll(() => page.locator(S.pm).innerText()).toMatch(/\[LDB_NAME_/);
  await expect(page.getByRole('button', { name: 'Resume on this site' })).toHaveCount(0);
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

test('Home tab copy action copies the latest assistant reply only', async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://chatgpt.com' });
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
        <p>Latest restored reply for ${placeholder}</p>
      </div>
      <div class="action-row">
        <button data-testid="copy-turn-action-button" aria-label="Copy">Copy</button>
      </div>
    `;
  }, token!);

  await openOverlay(page);
  await page.click(S.tab('home'));
  await page.getByRole('button', { name: 'Copy restored reply' }).click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Latest restored reply for a@b.com');
});

test('Protect selected text does not protect the whole field when nothing is selected', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com');
  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');

  await sendMessageToPage(page, { type: 'PROTECT_SELECTION', selectedText: '' });

  await expect.poll(() => page.inputValue(S.ta)).toContain('a@b.com');
  await expect(page.locator('.ledebe-toast')).toContainText('Select text first, then use Protect selected text.');
});

test('drawer shows the privacy note and selection protection actions', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('field'));
  await expect(page.locator('.ledebe-drawer__privacy-badge')).toContainText('Your data never leaves your device.');
  await expect(page.getByRole('button', { name: 'Protect selected text' })).toBeVisible();
});

test('drawer settings matches native settings for company join and feedback', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await expect(page.getByText('Protection controls', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Site actions', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Protect active field now' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Protect selected text' })).toHaveCount(1);
  await expect(page.getByText('Protection style', { exact: true })).toHaveCount(1);
  await page.getByText('Subscription, company sync and feedback').click();
  await expect(page.getByText('Company sync', { exact: true })).toBeVisible();
  await expect(page.getByText('Current site', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Subscription', { exact: true })).toHaveCount(1);
  await expect(page.getByPlaceholder('Company join code')).toBeVisible();
  await expect(page.getByPlaceholder('Work email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join company' })).toBeVisible();
  await expect(page.locator('.ledebe-drawer__section', { hasText: 'Feedback' })).toBeVisible();
  await expect(page.getByPlaceholder('Describe what happened...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send feedback' })).toBeVisible();
});

test('drawer feedback sends without forcing an anonymous email value', async ({ context }) => {
  let requestBody: Record<string, unknown> | null = null;
  await context.route('https://formspree.io/**', async (route) => {
    requestBody = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('settings'));
  await page.getByText('Subscription, company sync and feedback').click();
  await page.getByPlaceholder('Describe what happened...').fill('The feedback flow worked.');
  await page.getByRole('button', { name: 'Send feedback' }).click();

  await expect(page.locator('.ledebe-toast')).toContainText('Feedback sent. Thank you.');
  expect(requestBody).toMatchObject({
    source: 'browser-extension',
    category: 'browser-extension',
    host: 'chatgpt.com',
    message: 'The feedback flow worked.',
  });
  expect(requestBody).not.toHaveProperty('email');
});

test('custom term does not break a full email replacement', async ({ context }) => {
  const page = await openHost(context);
  await openOverlay(page);
  await page.click(S.tab('words'));
  await page.fill(S.wordsInput, 'blessing');
  await page.click(S.wordsBtn);

  await page.click(S.ta);
  await page.keyboard.type('blessing@gmail.com ');

  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await expect.poll(() => page.inputValue(S.ta)).not.toContain('@gmail.com');
});

test('settings toggles keep the settings pane open', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await openOverlay(page);
  await page.click(S.tab('settings'));

  await page.locator('.ledebe-toggle', { hasText: 'Replace as I type' }).locator('input').click();

  await expect(page.locator(S.drawerOpen)).toBeVisible();
  await expect(page.locator('.ledebe-toggle', { hasText: 'Replace as I type' })).toBeVisible();
  await expect(page.getByText('Advanced settings')).toBeVisible();
});

test('protected content opens the side panel automatically for quick unprotect actions', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await expect(page.locator(S.drawerOpen)).toBeVisible();
  await expect(page.locator('.ledebe-row--protected', { hasText: 'a@b.com' })).toBeVisible();
});

test('manual protect opens the panel so protected values can be reviewed immediately', async ({ context }) => {
  const page = await openHost(context);
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com');
  await expect(page.locator(S.drawerOpen)).toHaveCount(0);

  await sendMessageToPage(page, { type: 'PROTECT_ACTIVE_FIELD' });

  await expect.poll(() => page.inputValue(S.ta)).toMatch(/\[LDB_EMAIL_/);
  await expect(page.locator(S.drawerOpen)).toBeVisible();
  await expect(page.locator('.ledebe-row--protected', { hasText: 'a@b.com' })).toBeVisible();
});

test('does not open the in-page drawer when the native side panel is already open', async ({ context }) => {
  const page = await openHost(context, 'claude.ai');
  await page.click(S.ta);
  await page.keyboard.type('email a@b.com ');
  await sendMessageToPage(page, { type: 'PANEL_VISIBLE', visible: true });
  await sendMessageToPage(page, { type: 'OPEN_PANEL' });
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
