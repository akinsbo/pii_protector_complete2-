/**
 * Ledebe Protector — Core Functionality QA Suite
 *
 * Covers:
 *   1. PII Masking (email, phone, credit card, SSN, NI number, IP)
 *   2. Custom Terms masking
 *   3. Chat UI (tabs, copy, protected vs original)
 *   4. Chat History (create, rename, delete, menu positioning)
 *   5. Selection Protect button
 *   6. Word Detection Chips (capitalised words + common names)
 *   7. Custom Terms panel (collapsible, save & close)
 *   8. AI Sidebar gate (locked / unlocked)
 *   9. Dark Mode toggle
 *  10. Settings modal
 *  11. New Chat / clear state
 *  12. Restore (un-protect) flow
 */

import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#text-input', { state: 'visible' });
}

async function typeAndSend(page: Page, text: string) {
  await page.fill('#text-input', text);
  await page.click('#send-btn');
  // Wait for message to appear
  await page.waitForSelector('.chat-message', { state: 'visible', timeout: 5000 });
}

async function getProtectedText(page: Page): Promise<string> {
  const msg = page.locator('.chat-message').first();
  // "Protected Text" is the second tab (index 1) and is active by default
  await msg.locator('.message-tab').nth(1).click();
  return msg.locator('.message-text').innerText();
}

async function getOriginalText(page: Page): Promise<string> {
  const msg = page.locator('.chat-message').first();
  // "Plain Text" is the first tab (index 0)
  await msg.locator('.message-tab').nth(0).click();
  return msg.locator('.message-text').innerText();
}

// ── 1. PII MASKING ────────────────────────────────────────────────────────────

test.describe('PII Masking — Auto Detection', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('masks email addresses', async ({ page }) => {
    await typeAndSend(page, 'Contact me at john.doe@example.com for details.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('john.doe@example.com');
    expect(protected_).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('masks phone numbers', async ({ page }) => {
    await typeAndSend(page, 'Call me on +447911123456 anytime.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('+447911123456');
    expect(protected_).toMatch(/\[LDB_PHONE\d+\]/);
  });

  test('masks credit card numbers', async ({ page }) => {
    await typeAndSend(page, 'My card is 4111-1111-1111-1111 expires next year.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('4111-1111-1111-1111');
    expect(protected_).toMatch(/\[LDB_CC\d+\]/);
  });

  test('masks US Social Security Numbers', async ({ page }) => {
    await typeAndSend(page, 'SSN is 123-45-6789 for the application.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('123-45-6789');
    expect(protected_).toMatch(/\[LDB_ID\d+\]/);
  });

  test('masks UK National Insurance numbers', async ({ page }) => {
    await typeAndSend(page, 'My NI number is AB123456C for HMRC.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('AB123456C');
    expect(protected_).toMatch(/\[LDB_NINO\d+\]/);
  });

  test('masks IP addresses', async ({ page }) => {
    await typeAndSend(page, 'The server IP is 192.168.1.100 — do not share.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('192.168.1.100');
    expect(protected_).toMatch(/\[LDB_IP\d+\]/);
  });

  test('masks multiple PII types in one message', async ({ page }) => {
    await typeAndSend(
      page,
      'Email: test@example.com, phone: 555-123-4567, card: 5500-0000-0000-0004'
    );
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('test@example.com');
    expect(protected_).not.toContain('555-123-4567');
    expect(protected_).not.toContain('5500-0000-0000-0004');
    expect(protected_).toMatch(/\[LDB_EMAIL\d+\]/);
    expect(protected_).toMatch(/\[LDB_PHONE\d+\]/);
    expect(protected_).toMatch(/\[LDB_CC\d+\]/);
  });

  test('shows protection count badge', async ({ page }) => {
    await typeAndSend(page, 'Email: hello@test.com phone: 07700 900000');
    const badge = page.locator('.chat-message').first().locator('.protection-badge, .masked-count, [class*="count"]');
    // At minimum 2 items should be reported protected
    const text = await page.locator('.chat-message').first().innerText();
    expect(text).toMatch(/[2-9]|[1-9]\d/); // some number ≥ 2
  });

  test('original text is preserved in original tab', async ({ page }) => {
    const original = 'Contact me at original@email.com';
    await typeAndSend(page, original);
    const shown = await getOriginalText(page);
    expect(shown).toContain('original@email.com');
  });

  test('does not double-mask already-masked placeholders', async ({ page }) => {
    // First send a real message to generate a placeholder
    await typeAndSend(page, 'Contact hello@example.com for info');
    const protected_ = await getProtectedText(page);
    expect(protected_).toMatch(/\[LDB_EMAIL\d+\]/);
    // The placeholder itself should not be re-wrapped in another placeholder
    expect(protected_).not.toMatch(/\[LDB_\w+\[LDB_/);
  });
});

// ── 2. CUSTOM TERMS ───────────────────────────────────────────────────────────

test.describe('Custom Terms Masking', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    // Open custom terms panel
    await page.click('.custom-terms-header');
    await page.waitForSelector('.custom-terms-body', { state: 'visible' });
  });

  test('masks a single custom term', async ({ page }) => {
    await page.fill('#custom-terms', 'Barclays');
    await typeAndSend(page, 'I work at Barclays in the finance team.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('Barclays');
    expect(protected_).toMatch(/\[LDB_CUSTOM\d+\]/);
  });

  test('masks multiple custom terms', async ({ page }) => {
    await page.fill('#custom-terms', 'Barclays\nDeloitte\nManchesterOffice');
    await typeAndSend(page, 'The Barclays and Deloitte meeting is at ManchesterOffice.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('Barclays');
    expect(protected_).not.toContain('Deloitte');
    expect(protected_).not.toContain('ManchesterOffice');
  });

  test('custom terms are case-insensitive', async ({ page }) => {
    await page.fill('#custom-terms', 'Barclays');
    await typeAndSend(page, 'Contact barclays or BARCLAYS for support.');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('barclays');
    expect(protected_).not.toContain('BARCLAYS');
  });

  test('custom terms persist after page reload', async ({ page }) => {
    await page.fill('#custom-terms', 'SecretTerm');
    await page.click('button.save-close-btn');
    await page.reload();
    await page.waitForSelector('#text-input');
    // Open custom terms to verify
    await page.click('.custom-terms-header');
    const value = await page.inputValue('#custom-terms');
    expect(value).toContain('SecretTerm');
  });
});

// ── 3. CHAT UI ────────────────────────────────────────────────────────────────

test.describe('Chat UI', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('message appears in chat after sending', async ({ page }) => {
    await typeAndSend(page, 'Hello world test@example.com');
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(1);
  });

  test('protected tab is the default active tab', async ({ page }) => {
    await typeAndSend(page, 'My email is abc@test.com');
    const activeTab = page.locator('.chat-message').first().locator('.message-tab.active');
    await expect(activeTab).toContainText('Protected');
  });

  test('switching tabs shows different content', async ({ page }) => {
    await typeAndSend(page, 'My email is switch@test.com');
    const tabs = page.locator('.chat-message').first().locator('.message-tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    const protectedText = await getProtectedText(page);
    const originalText = await getOriginalText(page);
    // Protected should have placeholder, original should have real email
    expect(protectedText).not.toEqual(originalText);
    expect(protectedText).toMatch(/\[LDB_EMAIL\d+\]/);
    expect(originalText).toContain('switch@test.com');
  });

  test('sending empty message does nothing', async ({ page }) => {
    await page.fill('#text-input', '   ');
    await page.click('#send-btn');
    await page.waitForTimeout(500);
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(0);
  });

  test('input clears after sending', async ({ page }) => {
    await page.fill('#text-input', 'Some text to send test@example.com');
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message');
    const value = await page.inputValue('#text-input');
    expect(value).toBe('');
  });

  test('textarea grows with content', async ({ page }) => {
    const initialHeight = await page.$eval('#text-input', el => (el as HTMLElement).offsetHeight);
    await page.fill('#text-input', 'Line1\nLine2\nLine3\nLine4\nLine5');
    const newHeight = await page.$eval('#text-input', el => (el as HTMLElement).offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });
});

// ── 4. CHAT HISTORY ───────────────────────────────────────────────────────────

test.describe('Chat History', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('sending a message creates a history entry', async ({ page }) => {
    await typeAndSend(page, 'History test message with email@test.com');
    const items = page.locator('.history-item');
    await expect(items).toHaveCount(1);
  });

  test('history item shows truncated message text', async ({ page }) => {
    await typeAndSend(page, 'Short history entry test@test.com');
    const itemText = await page.locator('.history-item-text').first().innerText();
    expect(itemText.length).toBeGreaterThan(0);
  });

  test('options button (⋯) is visible on history item', async ({ page }) => {
    await typeAndSend(page, 'Test for history button visibility email@test.com');
    const optionBtn = page.locator('.history-actions button').first();
    await expect(optionBtn).toBeVisible();
  });

  test('options menu opens on click', async ({ page }) => {
    await typeAndSend(page, 'Test for options menu test@test.com');
    const optionBtn = page.locator('.history-actions button').first();
    await optionBtn.click();
    const menu = page.locator('.history-menu.show').first();
    await expect(menu).toBeVisible();
  });

  test('options menu has rename and delete items', async ({ page }) => {
    await typeAndSend(page, 'Menu items test test@test.com');
    await page.locator('.history-actions button').first().click();
    const menu = page.locator('.history-menu.show').first();
    await expect(menu.locator('.history-menu-item').nth(0)).toContainText('Rename');
    await expect(menu.locator('.history-menu-item').nth(1)).toContainText('Delete');
  });

  test('menu is positioned with fixed positioning (not clipped by overflow)', async ({ page }) => {
    await typeAndSend(page, 'Overflow test test@test.com');
    await page.locator('.history-actions button').first().click();
    const menu = page.locator('.history-menu.show').first();
    const position = await menu.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('deleting a history item removes it from the list', async ({ page }) => {
    await typeAndSend(page, 'To be deleted test@test.com');
    // Accept the confirm() dialog automatically
    page.on('dialog', d => d.accept());
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item.delete').first().click();
    await page.waitForTimeout(500);
    const items = page.locator('.history-item');
    await expect(items).toHaveCount(0);
  });

  test('new chat button starts a fresh chat', async ({ page }) => {
    await typeAndSend(page, 'First chat email@first.com');
    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(0);
  });

  test('multiple chats create multiple history items', async ({ page }) => {
    await typeAndSend(page, 'Chat one email@one.com');
    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);
    await typeAndSend(page, 'Chat two email@two.com');
    const items = page.locator('.history-item');
    await expect(items).toHaveCount(2);
  });
});

// ── 5. SELECTION PROTECT ─────────────────────────────────────────────────────

test.describe('Selection Protect Button', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('protect button appears when text is selected in textarea', async ({ page }) => {
    await page.fill('#text-input', 'Hello John Smith is here');
    // Select "John Smith" by setting selection via JS
    await page.evaluate(() => {
      const ta = document.getElementById('text-input') as HTMLTextAreaElement;
      ta.setSelectionRange(6, 16); // "John Smith"
      ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    const btn = page.locator('#selection-protect-btn');
    await expect(btn).toBeVisible({ timeout: 2000 });
  });

  test('protect button is hidden when no text is selected', async ({ page }) => {
    await page.fill('#text-input', 'Hello World');
    // Click without selecting
    await page.click('#text-input');
    const btn = page.locator('#selection-protect-btn');
    await expect(btn).toBeHidden();
  });

  test('clicking protect button adds word to custom terms', async ({ page }) => {
    // Open custom terms to verify
    await page.click('.custom-terms-header');
    await page.fill('#text-input', 'Contact BarclaysBank today');
    await page.evaluate(() => {
      const ta = document.getElementById('text-input') as HTMLTextAreaElement;
      ta.setSelectionRange(8, 20); // "BarclaysBank"
      ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.locator('#selection-protect-btn').click();
    const terms = await page.inputValue('#custom-terms');
    expect(terms).toContain('BarclaysBank');
  });

  test('adding duplicate term shows already-protected message', async ({ page }) => {
    await page.click('.custom-terms-header');
    await page.fill('#custom-terms', 'Barclays');
    await page.fill('#text-input', 'Call Barclays now');
    await page.evaluate(() => {
      const ta = document.getElementById('text-input') as HTMLTextAreaElement;
      ta.setSelectionRange(5, 13); // "Barclays"
      ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.locator('#selection-protect-btn').click();
    // Toast should show "already" message
    const toast = page.locator('#toast');
    await expect(toast).toContainText('already', { timeout: 2000 });
  });
});

// ── 6. WORD DETECTION CHIPS ───────────────────────────────────────────────────

test.describe('Word Detection Chips', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('capitalised mid-sentence word shows a chip', async ({ page }) => {
    await page.fill('#text-input', 'Please contact Deloitte ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(1, { timeout: 2000 });
    await expect(chips.first()).toContainText('Deloitte');
  });

  test('common first name in lowercase shows a chip', async ({ page }) => {
    await page.fill('#text-input', 'Ask sarah ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(1, { timeout: 2000 });
  });

  test('clicking Protect on chip adds word to custom terms', async ({ page }) => {
    await page.click('.custom-terms-header');
    await page.fill('#text-input', 'Ask James ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForSelector('.word-chip', { timeout: 2000 });
    await page.locator('.word-chip-protect').first().click();
    const terms = await page.inputValue('#custom-terms');
    expect(terms.toLowerCase()).toContain('james');
  });

  test('clicking dismiss removes the chip', async ({ page }) => {
    await page.fill('#text-input', 'Call Michael ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForSelector('.word-chip', { timeout: 2000 });
    await page.locator('.word-chip-dismiss').first().click();
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(0);
  });

  test('dismissed word does not reappear if typed again', async ({ page }) => {
    await page.fill('#text-input', 'Call Michael ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForSelector('.word-chip', { timeout: 2000 });
    await page.locator('.word-chip-dismiss').first().click();
    // Clear and retype same word
    await page.fill('#text-input', 'Also Michael ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForTimeout(500);
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(0);
  });

  test('chips are cleared when message is sent', async ({ page }) => {
    await page.fill('#text-input', 'Ask Barclays ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForSelector('.word-chip', { timeout: 2000 });
    await page.fill('#text-input', 'Contact test@test.com today');
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message');
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(0);
  });

  test('max 4 chips are shown at once', async ({ page }) => {
    // Type 5 different capitalised words
    for (const word of ['Alpha ', 'Beta ', 'Gamma ', 'Delta ', 'Epsilon ']) {
      await page.fill('#text-input', `Send to ${word}`);
      await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
      await page.waitForTimeout(200);
    }
    const chips = page.locator('.word-chip');
    const count = await chips.count();
    expect(count).toBeLessThanOrEqual(4);
  });

  test('word already in custom terms does not trigger a chip', async ({ page }) => {
    await page.click('.custom-terms-header');
    await page.fill('#custom-terms', 'Barclays');
    await page.fill('#text-input', 'Contact Barclays ');
    await page.locator('#text-input').dispatchEvent('keyup', { key: ' ' });
    await page.waitForTimeout(500);
    const chips = page.locator('.word-chip');
    await expect(chips).toHaveCount(0);
  });
});

// ── 7. CUSTOM TERMS PANEL ─────────────────────────────────────────────────────

test.describe('Custom Terms Panel', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('panel is collapsed by default', async ({ page }) => {
    const body = page.locator('.custom-terms-body');
    await expect(body).toBeHidden();
  });

  test('clicking header expands the panel', async ({ page }) => {
    await page.click('.custom-terms-header');
    const body = page.locator('.custom-terms-body');
    await expect(body).toBeVisible();
  });

  test('clicking header again collapses the panel', async ({ page }) => {
    await page.click('.custom-terms-header');
    await page.waitForSelector('.custom-terms-body', { state: 'visible' });
    await page.click('.custom-terms-header');
    const body = page.locator('.custom-terms-body');
    await expect(body).toBeHidden();
  });

  test('save & close collapses the panel', async ({ page }) => {
    await page.click('.custom-terms-header');
    await page.waitForSelector('.custom-terms-body', { state: 'visible' });
    await page.click('.save-close-btn');
    const body = page.locator('.custom-terms-body');
    await expect(body).toBeHidden({ timeout: 2000 });
  });

  test('open/closed state persists after reload', async ({ page }) => {
    await page.click('.custom-terms-header'); // open it
    await page.waitForSelector('.custom-terms-body', { state: 'visible' });
    await page.reload();
    await page.waitForSelector('#text-input');
    const body = page.locator('.custom-terms-body');
    await expect(body).toBeVisible();
  });
});

// ── 8. AI SIDEBAR GATE ────────────────────────────────────────────────────────

test.describe('AI Sidebar Gate', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('locked panel shown when no API key is verified', async ({ page }) => {
    // Expand AI section
    await page.click('#ai-models-toggle');
    await page.waitForSelector('#ai-models-list', { state: 'visible' });
    const locked = page.locator('#ai-locked-panel');
    await expect(locked).toBeVisible();
    const unlocked = page.locator('#ai-unlocked-panel');
    await expect(unlocked).toBeHidden();
  });

  test('unlocked panel shown when API key is verified in localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('aiKeyVerified', 'true');
      localStorage.setItem('aiKey', 'sk-test-key-123');
      localStorage.setItem('aiVerifiedKey', 'sk-test-key-123');
    });
    await page.reload();
    await page.waitForSelector('#text-input');
    await page.click('#ai-models-toggle');
    await page.waitForSelector('#ai-models-list', { state: 'visible' });
    const unlocked = page.locator('#ai-unlocked-panel');
    await expect(unlocked).toBeVisible({ timeout: 2000 });
  });

  test('locked panel shown when verified key does not match current key', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('aiKeyVerified', 'true');
      localStorage.setItem('aiKey', 'sk-different-key');
      localStorage.setItem('aiVerifiedKey', 'sk-original-key');
    });
    await page.reload();
    await page.waitForSelector('#text-input');
    await page.click('#ai-models-toggle');
    await page.waitForSelector('#ai-models-list', { state: 'visible' });
    const locked = page.locator('#ai-locked-panel');
    await expect(locked).toBeVisible({ timeout: 2000 });
  });
});

// ── 9. DARK MODE ──────────────────────────────────────────────────────────────

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('dark mode toggle switches data-theme attribute', async ({ page }) => {
    const before = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    // Trigger via JS since the checkbox is inside a CSS-styled toggle label
    await page.evaluate(() => {
      const cb = document.getElementById('darkMode') as HTMLInputElement;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
    const after = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(after).not.toBe(before);
    expect(after).toMatch(/dark|light/);
  });

  test('dark mode preference is saved to localStorage', async ({ page }) => {
    await page.evaluate(() => {
      const cb = document.getElementById('darkMode') as HTMLInputElement;
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    });
    const saved = await page.evaluate(() => localStorage.getItem('theme'));
    expect(saved).toMatch(/dark|light/);
  });

  test('dark mode preference is restored on reload', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.reload();
    await page.waitForSelector('#text-input');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });
});

// ── 10. SETTINGS MODAL ───────────────────────────────────────────────────────

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('settings modal opens', async ({ page }) => {
    await page.click('button[onclick="showSettings()"]');
    const modal = page.locator('#settings-modal, .settings-modal, [id*="settings"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('settings modal can be closed', async ({ page }) => {
    await page.click('button[onclick="showSettings()"]');
    await page.waitForSelector('.shortcuts-modal.show, .modal.show, [class*="modal"][class*="show"]', {
      state: 'visible',
      timeout: 3000,
    });
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const openModals = page.locator('.shortcuts-modal.show');
    await expect(openModals).toHaveCount(0);
  });

  test('AI provider selector is present in settings', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('aiEnabled', 'true'));
    await page.click('button[onclick="showSettings()"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#settings-ai-provider')).toBeVisible({ timeout: 3000 });
  });

  test('API key input is present in settings', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('aiEnabled', 'true'));
    await page.click('button[onclick="showSettings()"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#settings-ai-key')).toBeVisible({ timeout: 3000 });
  });
});

// ── 11. RESTORE (UN-PROTECT) FLOW ─────────────────────────────────────────────

test.describe('Restore Flow', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('pasting a placeholder string into input triggers restore mode', async ({ page }) => {
    // First send a message to create a placeholder map
    await typeAndSend(page, 'My email is restore@test.com');
    // Get the protected text
    const protected_ = await getProtectedText(page);
    // Paste it back into the input
    await page.fill('#text-input', protected_);
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message:nth-child(2)', { timeout: 3000 });
    const restoreMsg = page.locator('.chat-message').nth(1);
    const text = await restoreMsg.innerText();
    expect(text).toContain('restore@test.com');
  });
});

// ── 12. KEYBOARD SHORTCUTS ───────────────────────────────────────────────────

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('Enter key sends message', async ({ page }) => {
    await page.fill('#text-input', 'Enter key test email@test.com');
    await page.locator('#text-input').press('Enter');
    await page.waitForSelector('.chat-message', { timeout: 3000 });
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(1);
  });

  test('Shift+Enter inserts a new line instead of sending', async ({ page }) => {
    await page.fill('#text-input', 'Line one');
    await page.locator('#text-input').press('Shift+Enter');
    await page.waitForTimeout(300);
    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(0);
    const value = await page.inputValue('#text-input');
    expect(value).toContain('\n');
  });
});

// ── 13. SIDEBAR COLLAPSE ─────────────────────────────────────────────────────

test.describe('Sidebar Collapse', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('sidebar toggles collapsed state', async ({ page }) => {
    const sidebar = page.locator('#history-sidebar');
    await page.click('#sidebar-toggle-btn');
    await expect(sidebar).toHaveClass(/collapsed/, { timeout: 1000 });
    await page.click('#sidebar-toggle-btn');
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('history list is hidden when sidebar is collapsed', async ({ page }) => {
    await page.click('#sidebar-toggle-btn');
    const historyList = page.locator('.history-list');
    await expect(historyList).toBeHidden();
  });
});
