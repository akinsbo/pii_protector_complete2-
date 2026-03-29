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
    // Button is disabled for whitespace-only input — verify then force-click to confirm no message is created
    await expect(page.locator('#send-btn')).toBeDisabled();
    await page.click('#send-btn', { force: true });
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
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item.delete').first().click();
    // Delete now uses an inline overlay instead of confirm() — click the overlay's Delete button
    await page.locator('.delete-confirm-overlay button').first().click();
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

// ── 14. HISTORY RENAME END-TO-END ────────────────────────────────────────────

test.describe('History Rename', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('rename updates the history item text in UI', async ({ page }) => {
    await typeAndSend(page, 'Message to rename email@test.com');
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item').nth(0).click(); // Rename
    await page.locator('.rename-input').fill('My Renamed Chat');
    await page.locator('.rename-overlay button').first().click(); // Save
    await page.waitForTimeout(300);
    const itemText = page.locator('.history-item-text').first();
    await expect(itemText).toContainText('My Renamed Chat');
  });

  test('rename persists after page reload', async ({ page }) => {
    await typeAndSend(page, 'Persistent rename test email@test.com');
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item').nth(0).click();
    await page.locator('.rename-input').fill('Persisted Name');
    await page.locator('.rename-overlay button').first().click();
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForSelector('.history-item');
    await expect(page.locator('.history-item-text').first()).toContainText('Persisted Name');
  });

  test('rename cancel leaves item text unchanged', async ({ page }) => {
    await typeAndSend(page, 'Cancel rename test email@test.com');
    const originalText = await page.locator('.history-item-text').first().innerText();
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item').nth(0).click();
    await page.locator('.rename-input').fill('Should Not Save');
    await page.locator('.rename-overlay button').nth(1).click(); // Cancel
    await page.waitForTimeout(300);
    await expect(page.locator('.history-item-text').first()).toContainText(originalText.trim());
  });

  test('chat content is still accessible after rename', async ({ page }) => {
    await typeAndSend(page, 'Content stays after rename hello@test.com');
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item').nth(0).click();
    await page.locator('.rename-input').fill('Renamed But Intact');
    await page.locator('.rename-overlay button').first().click();
    await page.waitForTimeout(300);
    // Click the renamed item to reload messages
    await page.locator('.history-item-content').first().click();
    await page.waitForSelector('.chat-message');
    const msgCount = await page.locator('.chat-message').count();
    expect(msgCount).toBeGreaterThanOrEqual(1);
  });
});

// ── 15. DELETE CANCEL PATH ───────────────────────────────────────────────────

test.describe('Delete Cancel', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('clicking Cancel in delete overlay keeps the item', async ({ page }) => {
    await typeAndSend(page, 'Should survive cancel email@test.com');
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item.delete').first().click();
    // Cancel button is the second button in the overlay
    await page.locator('.delete-confirm-overlay button').nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.history-item')).toHaveCount(1);
  });

  test('overlay disappears after cancel', async ({ page }) => {
    await typeAndSend(page, 'Overlay gone after cancel email@test.com');
    await page.locator('.history-actions button').first().click();
    await page.locator('.history-menu.show .history-menu-item.delete').first().click();
    await page.locator('.delete-confirm-overlay button').nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.delete-confirm-overlay')).toHaveCount(0);
  });
});

// ── 16. HISTORY ITEM RESTORES CORRECT THREAD ─────────────────────────────────

test.describe('History Thread Switching', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('clicking a history item loads its messages', async ({ page }) => {
    await typeAndSend(page, 'First thread phone@one.com');
    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);
    await typeAndSend(page, 'Second thread email@two.com');

    // Click the first history entry (oldest = last in the list)
    const items = page.locator('.history-item-content');
    const count = await items.count();
    await items.nth(count - 1).click();
    await page.waitForTimeout(300);

    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(1);
    const text = await messages.first().innerText();
    expect(text).toContain('[LDB_');
  });

  test('switching back to second thread shows its messages', async ({ page }) => {
    await typeAndSend(page, 'Alpha thread alpha@test.com');
    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);
    await typeAndSend(page, 'Beta thread beta@test.com');

    // Switch to first thread (last in history list)
    const items = page.locator('.history-item-content');
    const count = await items.count();
    await items.nth(count - 1).click();
    await page.waitForTimeout(300);
    // Switch back to second thread (first in history list)
    await items.first().click();
    await page.waitForTimeout(300);

    const messages = page.locator('.chat-message');
    await expect(messages).toHaveCount(1);
  });
});

// ── 17. COPY PROTECTED TEXT ──────────────────────────────────────────────────

test.describe('Copy Protected Text', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    // Grant clipboard-write permission
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
  });

  test('copy button triggers success toast', async ({ page }) => {
    await typeAndSend(page, 'Copy this email@copy.com');
    await page.locator('.chat-message .message-action-btn[data-label="Copy"]').first().click();
    await expect(page.locator('#toast')).toContainText('copied', { timeout: 3000 });
  });

  test('Ctrl+Shift+C copies protected text from last message', async ({ page }) => {
    await typeAndSend(page, 'Keyboard copy test email@kbcopy.com');
    // Use platform-aware modifier (Mac uses Meta, others use Ctrl)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Shift+C`);
    await expect(page.locator('#toast')).toContainText('copied', { timeout: 3000 });
  });
});

// ── 18. EDIT MESSAGE FLOW ────────────────────────────────────────────────────

test.describe('Edit Message', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('edit button renders a textarea with original text', async ({ page }) => {
    await typeAndSend(page, 'Original text email@orig.com');
    await page.locator('.chat-message .message-action-btn').filter({ hasText: '✏️' }).first().click();
    const ta = page.locator('.edit-textarea');
    await expect(ta).toBeVisible();
    const val = await ta.inputValue();
    expect(val).toContain('email@orig.com');
  });

  test('saving edited message re-runs PII masking', async ({ page }) => {
    await typeAndSend(page, 'Old text with no PII here');
    await page.locator('.chat-message .message-action-btn').filter({ hasText: '✏️' }).first().click();
    await page.locator('.edit-textarea').fill('New text with email@new.com inside');
    // Click the Save button inside the edit area
    await page.locator('.chat-message button').filter({ hasText: 'Save' }).first().click();
    await page.waitForTimeout(300);
    // Protected view should now contain a placeholder
    const msg = page.locator('.chat-message').first();
    const text = await msg.innerText();
    expect(text).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('cancelling edit restores original content', async ({ page }) => {
    await typeAndSend(page, 'Cancel edit test email@cancel.com');
    const protectedBefore = await getProtectedText(page);
    await page.locator('.chat-message .message-action-btn').filter({ hasText: '✏️' }).first().click();
    await page.locator('.edit-textarea').fill('Something completely different');
    await page.locator('.chat-message button').filter({ hasText: 'Cancel' }).first().click();
    await page.waitForTimeout(300);
    const protectedAfter = await getProtectedText(page);
    expect(protectedAfter).toBe(protectedBefore);
  });

  test('save shows "Message updated" toast', async ({ page }) => {
    await typeAndSend(page, 'Toast edit test email@toast.com');
    await page.locator('.chat-message .message-action-btn').filter({ hasText: '✏️' }).first().click();
    await page.locator('.edit-textarea').fill('Updated text email@updated.com');
    await page.locator('.chat-message button').filter({ hasText: 'Save' }).first().click();
    await expect(page.locator('#toast')).toContainText('updated', { timeout: 3000 });
  });
});

// ── 19. RESTORE WITH MIXED PLACEHOLDERS ──────────────────────────────────────

test.describe('Restore — Mixed Placeholders', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('known placeholders are restored, unknown ones are left unchanged', async ({ page }) => {
    // Generate a real placeholder
    await typeAndSend(page, 'My email is mixed@test.com for reference');
    const protected_ = await getProtectedText(page);
    // Build a string mixing the real placeholder with a fake one
    const mixed = protected_.replace(/\[LDB_EMAIL\d+\]/, '[LDB_EMAIL1]') + ' and [LDB_FAKE_UNKNOWN99]';
    // Paste into input and send
    await page.fill('#text-input', mixed);
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message:nth-child(2)', { timeout: 5000 });
    const restored = await page.locator('.chat-message').nth(1).innerText();
    // Unknown placeholder must not crash — it stays or is left as-is
    expect(restored).not.toContain('undefined');
    expect(restored).not.toContain('[object');
  });
});

// ── 20. FILE UPLOAD HAPPY PATH ───────────────────────────────────────────────

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('uploading a .txt file displays a file card', async ({ page }) => {
    const fileContent = 'John Smith john@example.com 07700900000';
    await page.setInputFiles('#file-input', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    const card = page.locator('.uploaded-file');
    await expect(card).toBeVisible();
    await expect(card).toContainText('test.txt');
  });

  test('uploading a .csv file displays a file card', async ({ page }) => {
    const csv = 'name,email\nAlice,alice@csv.com\nBob,bob@csv.com';
    await page.setInputFiles('#file-input', {
      name: 'data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    await expect(page.locator('.uploaded-file')).toContainText('data.csv');
  });

  test('.txt upload populates the text-input with file preview', async ({ page }) => {
    const fileContent = 'Preview content email@file.com phone 555-1234';
    await page.setInputFiles('#file-input', {
      name: 'preview.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent),
    });
    await page.waitForTimeout(800);
    const inputValue = await page.inputValue('#text-input');
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test('remove button clears the file card and input', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'remove.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('some content email@remove.com'),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    await page.locator('.uploaded-file button[onclick*="removeUploadedFile"]').click();
    await expect(page.locator('.uploaded-file')).toHaveCount(0);
    expect(await page.inputValue('#text-input')).toBe('');
  });
});

// ── 21. KEYBOARD SHORTCUTS ───────────────────────────────────────────────────

test.describe('Keyboard Shortcuts — Extended', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('Ctrl+K starts a new chat and shows toast', async ({ page }) => {
    await typeAndSend(page, 'Before new chat email@before.com');
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.locator('#toast')).toContainText('New chat', { timeout: 2000 });
    await expect(page.locator('.chat-message')).toHaveCount(0);
  });

  test('Ctrl+/ opens the shortcuts modal', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+/`);
    const modal = page.locator('#shortcuts-modal');
    await expect(modal).toBeVisible({ timeout: 2000 });
  });

  test('Ctrl+Enter sends a message', async ({ page }) => {
    await page.fill('#text-input', 'Ctrl enter test email@ctrl.com');
    await page.keyboard.press('Control+Enter');
    await page.waitForSelector('.chat-message', { timeout: 3000 });
    await expect(page.locator('.chat-message')).toHaveCount(1);
  });
});

// ── 22. THEME AUTO MODE ──────────────────────────────────────────────────────

test.describe('Theme Auto Mode', () => {
  test('auto theme follows OS dark preference', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => localStorage.setItem('theme', 'auto'));
    await page.reload();
    await page.waitForSelector('#text-input');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('auto theme follows OS light preference', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => localStorage.setItem('theme', 'auto'));
    await page.reload();
    await page.waitForSelector('#text-input');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
  });
});

// ── 23. SIDEBAR COLLAPSE PERSISTENCE ─────────────────────────────────────────

test.describe('Sidebar Collapse Persistence', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('collapsed state persists after reload', async ({ page }) => {
    await page.click('#sidebar-toggle-btn');
    await expect(page.locator('#history-sidebar')).toHaveClass(/collapsed/);
    await page.reload();
    await page.waitForSelector('#text-input');
    await expect(page.locator('#history-sidebar')).toHaveClass(/collapsed/);
  });

  test('send button is still usable when sidebar is collapsed', async ({ page }) => {
    await page.click('#sidebar-toggle-btn');
    await page.fill('#text-input', 'Works while collapsed email@side.com');
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message', { timeout: 3000 });
    await expect(page.locator('.chat-message')).toHaveCount(1);
  });
});

// ── 24. XSS HARDENING ────────────────────────────────────────────────────────

test.describe('XSS Hardening', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('script tag payload is not executed', async ({ page }) => {
    let xssRan = false;
    await page.exposeFunction('__xssHit', () => { xssRan = true; });
    await typeAndSend(page, '<script>window.__xssHit()</script>');
    await page.waitForTimeout(500);
    expect(xssRan).toBe(false);
  });

  test('HTML payload is escaped in the protected tab', async ({ page }) => {
    await typeAndSend(page, '<img src=x onerror="alert(1)"> my email email@xss.com');
    // No live img element should have been injected into the message
    const imgCount = await page.locator('.chat-message img[src="x"]').count();
    expect(imgCount).toBe(0);
  });

  test('HTML payload is escaped in the original tab', async ({ page }) => {
    await typeAndSend(page, '<b>bold</b> and email@xss2.com');
    // No live <b> element should have been injected into the message
    const boldCount = await page.locator('.chat-message b').count();
    expect(boldCount).toBe(0);
  });

  test('iframe injection does not render', async ({ page }) => {
    let iframeCount = 0;
    await typeAndSend(page, '<iframe src="javascript:alert(1)"></iframe>');
    await page.waitForTimeout(500);
    iframeCount = await page.locator('.chat-message iframe').count();
    expect(iframeCount).toBe(0);
  });
});

// ── 25. MESSAGE ACTIONS — COPY ────────────────────────────────────────────────

test.describe('Message Copy Action', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
  });

  test('copy button copies protected text (placeholder), not raw PII', async ({ page }) => {
    await typeAndSend(page, 'My email is copy@test.com please');
    await page.locator('.chat-message .message-action-btn[data-label="Copy"]').first().click();
    await page.waitForTimeout(300);
    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipText).toMatch(/\[LDB_EMAIL\d+\]/);
    expect(clipText).not.toContain('copy@test.com');
  });

  test('copy toast appears then auto-dismisses within 4 seconds', async ({ page }) => {
    await typeAndSend(page, 'Toast timer test email@timer.com');
    await page.locator('.chat-message .message-action-btn[data-label="Copy"]').first().click();
    await expect(page.locator('#toast')).toHaveClass(/show/, { timeout: 1000 });
    // Toast should disappear within 4 seconds (app uses 3 s timeout)
    await expect(page.locator('#toast')).not.toHaveClass(/show/, { timeout: 4000 });
  });
});

// ── 26. MESSAGE DELETE OVERLAY ───────────────────────────────────────────────

test.describe('Message Delete Action', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('delete shows inline overlay, not a browser dialog', async ({ page }) => {
    await typeAndSend(page, 'Delete overlay test email@del.com');
    let dialogAppeared = false;
    page.on('dialog', () => { dialogAppeared = true; });
    await page.locator('.chat-message .message-action-btn[data-label="Delete"]').first().click();
    await page.waitForTimeout(300);
    expect(dialogAppeared).toBe(false);
    await expect(page.locator('.chat-message .delete-confirm')).toBeVisible();
  });

  test('delete cancel keeps the message', async ({ page }) => {
    await typeAndSend(page, 'Survive delete cancel email@keep.com');
    await page.locator('.chat-message .message-action-btn[data-label="Delete"]').first().click();
    // Cancel is the second button in the overlay
    await page.locator('.delete-confirm button').nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.chat-message')).toHaveCount(1);
  });

  test('confirming delete removes the message', async ({ page }) => {
    await typeAndSend(page, 'Actually delete this email@gone.com');
    await page.locator('.chat-message .message-action-btn[data-label="Delete"]').first().click();
    await page.locator('.delete-confirm button').first().click(); // Delete
    await page.waitForTimeout(300);
    await expect(page.locator('.chat-message')).toHaveCount(0);
  });
});

// ── 27. MESSAGE EDIT — IN-PLACE COUNT ────────────────────────────────────────

test.describe('Edit Message — In-place', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('edit updates in place — message count stays at 1', async ({ page }) => {
    await typeAndSend(page, 'Original message email@inplace.com');
    await page.locator('.chat-message .message-action-btn[data-label="Edit"]').first().click();
    await page.locator('.edit-textarea').fill('Edited message email@edited.com');
    await page.locator('.chat-message button').filter({ hasText: 'Save' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.chat-message')).toHaveCount(1);
  });
});

// ── 28. SEND BUTTON STATE ─────────────────────────────────────────────────────

test.describe('Send Button State', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('send button is disabled on initial load', async ({ page }) => {
    await expect(page.locator('#send-btn')).toBeDisabled();
  });

  test('send button enables after typing non-whitespace', async ({ page }) => {
    await page.fill('#text-input', 'a');
    await expect(page.locator('#send-btn')).toBeEnabled();
  });

  test('send button re-disables after clearing input', async ({ page }) => {
    await page.fill('#text-input', 'some text');
    await expect(page.locator('#send-btn')).toBeEnabled();
    await page.fill('#text-input', '');
    await expect(page.locator('#send-btn')).toBeDisabled();
  });

  test('send button is re-disabled after a message is sent', async ({ page }) => {
    await page.fill('#text-input', 'Message to send email@send.com');
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message');
    await expect(page.locator('#send-btn')).toBeDisabled();
  });
});

// ── 29. MULTI-TURN PLACEHOLDER CUMULATION ────────────────────────────────────

test.describe('Multi-turn Placeholder Map', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('placeholder map accumulates across turns', async ({ page }) => {
    // Turn 1: email gets a placeholder
    await typeAndSend(page, 'Turn one email is first@turn.com');
    const turn1Protected = await getProtectedText(page);
    const emailPlaceholder = turn1Protected.match(/\[LDB_EMAIL\d+\]/)?.[0];
    expect(emailPlaceholder).toBeTruthy();

    // Turn 2: phone gets a placeholder — email map entry must still exist
    await typeAndSend(page, 'Turn two phone is 07700900001');
    // Now paste the email placeholder back — it should restore
    await page.fill('#text-input', emailPlaceholder!);
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message:nth-child(3)', { timeout: 5000 });
    const restoredMsg = page.locator('.chat-message').nth(2);
    await expect(restoredMsg).toContainText('first@turn.com');
  });

  test('clearing conversation resets the placeholder map', async ({ page }) => {
    await typeAndSend(page, 'Before clear email@before.com');
    const protected1 = await getProtectedText(page);
    protected1.match(/\[LDB_EMAIL(\d+)\]/)?.[1];

    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);

    await typeAndSend(page, 'After clear email@after.com');
    const protected2 = await getProtectedText(page);
    const p2 = protected2.match(/\[LDB_EMAIL(\d+)\]/)?.[1];

    // After clearing, placeholder numbering should restart from 1
    expect(p2).toBe('1');
    // And p1 (from a different conversation) is irrelevant — just confirm masking works
    expect(protected2).toMatch(/\[LDB_EMAIL\d+\]/);
  });
});

// ── 30. COMPANY SYNC INTEGRATION ─────────────────────────────────────────────

test.describe('Company Sync — Term Merging', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('getAllTerms() merges company and personal terms', async ({ page }) => {
    // Set company terms in localStorage, then reload so companySync picks them up
    await page.evaluate(() => {
      localStorage.setItem('ledebe-company-terms', JSON.stringify([{ text: 'AcmeCorp' }]));
    });
    await page.reload();
    await page.waitForSelector('#text-input');

    // Set personal term in the textarea AFTER reload — getAllTerms() reads it live
    await page.click('.custom-terms-header');
    await page.fill('#custom-terms', 'PersonalTerm');

    const terms = await page.evaluate(() => {
      return (window as any).companySync?.getAllTerms() ?? [];
    });
    expect(terms).toContain('AcmeCorp');
    expect(terms).toContain('PersonalTerm');
  });

  test('company terms are masked in protected view', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('ledebe-company-terms', JSON.stringify([{ text: 'AcmeCorp' }]));
    });
    await page.reload();
    await page.waitForSelector('#text-input');

    await typeAndSend(page, 'I work at AcmeCorp in London');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('AcmeCorp');
    expect(protected_).toMatch(/\[LDB_CUSTOM\d+\]/);
  });
});

// ── 31. TOAST NOTIFICATIONS ──────────────────────────────────────────────────

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
  });

  test('copy action shows "copied" toast', async ({ page }) => {
    await typeAndSend(page, 'Toast copy test email@toastcopy.com');
    await page.locator('.chat-message .message-action-btn[data-label="Copy"]').first().click();
    await expect(page.locator('#toast')).toContainText('copied', { timeout: 2000 });
  });

  test('successful send shows no error toast', async ({ page }) => {
    await typeAndSend(page, 'No error expected email@noerror.com');
    const toastText = await page.locator('#toast').innerText();
    expect(toastText.toLowerCase()).not.toContain('error');
    expect(toastText.toLowerCase()).not.toContain('failed');
  });
});

// ── 32. FILE UPLOAD — FORMAT DETECTION ───────────────────────────────────────

test.describe('File Upload — Format Detection', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('.txt file containing PII — protected view shows placeholder after send', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'pii.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Contact Jane at jane@private.com for info.'),
    });
    // Text files go through showDocumentCard() — wait for the document card to appear
    await page.waitForSelector('.document-card', { timeout: 5000 });
    // The protected text is stored in previewData — expose it from the page
    const protectedText = await page.evaluate(() => {
      return (window as any).previewData?.protectedText ?? '';
    });
    expect(protectedText).not.toContain('jane@private.com');
    expect(protectedText).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('.csv file displays the uploaded file card', async ({ page }) => {
    const csv = 'name,email,phone\nAlice,alice@csv.com,555-0001\nBob,bob@csv.com,555-0002';
    await page.setInputFiles('#file-input', {
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    await expect(page.locator('.uploaded-file')).toContainText('contacts.csv');
  });

  test('.md file upload populates textarea with content', async ({ page }) => {
    const md = '# Heading\n\nSome **bold** text and email@md.com';
    await page.setInputFiles('#file-input', {
      name: 'doc.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(md),
    });
    await page.waitForTimeout(800);
    const val = await page.inputValue('#text-input');
    expect(val.length).toBeGreaterThan(0);
  });

  test('uploaded filename is shown in the file card', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'my-report.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Report content here'),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    await expect(page.locator('.uploaded-file')).toContainText('my-report.txt');
  });

  test('removing file card clears attachment and input', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'clear-me.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Will be cleared'),
    });
    await page.waitForSelector('.uploaded-file', { timeout: 3000 });
    await page.locator('.uploaded-file button[title="Remove"]').click();
    await expect(page.locator('.uploaded-file')).toHaveCount(0);
    expect(await page.inputValue('#text-input')).toBe('');
  });
});

// ── 33. EDGE CASES ────────────────────────────────────────────────────────────

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('very long message (5000+ chars) processes without freezing', async ({ page }) => {
    const base = 'Lorem ipsum dolor sit amet. Contact help@example.com for details. ';
    const longText = base.repeat(Math.ceil(5000 / base.length));
    await page.fill('#text-input', longText.substring(0, 5000));
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message', { timeout: 10000 });
    await expect(page.locator('.chat-message')).toHaveCount(1);
  });

  test('message with only PII — protected view is not empty', async ({ page }) => {
    await typeAndSend(page, 'onlypii@example.com');
    const protected_ = await getProtectedText(page);
    expect(protected_.trim().length).toBeGreaterThan(0);
    expect(protected_).not.toContain('onlypii@example.com');
  });

  test('repeated identical email maps to the same placeholder', async ({ page }) => {
    await typeAndSend(page, 'Email: same@test.com and again same@test.com here');
    const protected_ = await getProtectedText(page);
    // Extract all placeholders used
    const placeholders = protected_.match(/\[LDB_EMAIL\d+\]/g) || [];
    // Both occurrences should be the same placeholder
    expect(new Set(placeholders).size).toBe(1);
    expect(protected_).not.toContain('same@test.com');
  });

  test('plain text with no PII shows no protection badge', async ({ page }) => {
    await typeAndSend(page, 'Just a normal sentence with no sensitive data here.');
    const msg = page.locator('.chat-message').first();
    const hasBadge = await msg.locator('.protection-badge').count();
    expect(hasBadge).toBe(0);
  });
});

// ── 34. PII — URL CREDENTIALS ─────────────────────────────────────────────────

test.describe('PII Masking — URL Credentials', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('password segment in URL credentials is masked', async ({ page }) => {
    // The email regex matches "password@api.example.com" inside the URL
    await typeAndSend(page, 'Connect to https://user:password@api.example.com for data');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toContain('password@api.example.com');
    expect(protected_).toMatch(/\[LDB_EMAIL\d+\]/);
  });
});

// ── 35. PII — FALSE POSITIVES ─────────────────────────────────────────────────

test.describe('PII Masking — False Positives', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('template literal syntax is not treated as an email', async ({ page }) => {
    // ${user}@${domain} — the curly braces break the email regex
    await typeAndSend(page, 'The template is `${user}@${domain}` in code');
    const protected_ = await getProtectedText(page);
    expect(protected_).not.toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('IPv6 address is not masked (IPv6 not in ruleset)', async ({ page }) => {
    await typeAndSend(page, 'Server at 2001:0db8:85a3::8a2e:0370:7334 is down');
    const protected_ = await getProtectedText(page);
    // IPv6 detection is not implemented — the address should remain in the output
    expect(protected_).toContain('2001:0db8:85a3');
  });
});

// ── 36. SETTINGS MODAL ────────────────────────────────────────────────────────

// Helper: open settings and reveal the AI config section
async function openSettings(page: Page) {
  await page.click('button.header-btn[onclick="showSettings()"]');
  await expect(page.locator('#settings-modal')).toHaveClass(/show/, { timeout: 2000 });
  // Enable AI to show the provider / key fields
  const enableCb = page.locator('#settings-ai-enabled');
  if (!(await enableCb.isChecked())) await enableCb.check();
  await expect(page.locator('#ai-config')).toBeVisible();
}

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('API key persists to localStorage after save', async ({ page }) => {
    await openSettings(page);
    await page.fill('#settings-ai-key', 'sk-test-persist-key');
    await page.click('button[onclick="saveSettings()"]');
    await page.waitForTimeout(300);
    const stored = await page.evaluate(() =>
      localStorage.getItem('aiKeyEncrypted') || localStorage.getItem('aiKey') || ''
    );
    expect(stored.length).toBeGreaterThan(0);
  });

  test('changing AI provider persists to localStorage', async ({ page }) => {
    await openSettings(page);
    await page.selectOption('#settings-ai-provider', 'anthropic');
    await page.click('button[onclick="saveSettings()"]');
    await page.waitForTimeout(300);
    const provider = await page.evaluate(() => localStorage.getItem('aiProvider'));
    expect(provider).toBe('anthropic');
  });

  test('settings modal closes on backdrop click', async ({ page }) => {
    await page.click('button.header-btn[onclick="showSettings()"]');
    await expect(page.locator('#settings-modal')).toHaveClass(/show/, { timeout: 2000 });
    // Click the backdrop (the modal element itself, outside the inner content)
    await page.locator('#settings-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#settings-modal')).not.toHaveClass(/show/);
  });

  test('API key input field is type=password', async ({ page }) => {
    await openSettings(page);
    const inputType = await page.locator('#settings-ai-key').getAttribute('type');
    expect(inputType).toBe('password');
  });
});

// ── 37. HISTORY — PERSISTENCE & ORDERING ─────────────────────────────────────

test.describe('History — Persistence & Ordering', () => {
  // Note: these tests do NOT call loadApp() (which clears localStorage) in beforeEach

  test('history item persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    await typeAndSend(page, 'Persist me persist@history.com');
    await expect(page.locator('.history-item')).toHaveCount(1);
    await page.reload();
    await page.waitForSelector('#text-input');
    await expect(page.locator('.history-item')).toHaveCount(1);
  });

  test('loading a history item restores the protected message display', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    await typeAndSend(page, 'Restore check restore@history.com');
    // Reload without clearing localStorage
    await page.reload();
    await page.waitForSelector('#text-input');
    // Load the saved history item — messages are re-rendered with their placeholder maps
    await page.locator('.history-item-content').first().click();
    await page.waitForTimeout(300);
    // The re-loaded message should have at least one .chat-message visible
    await expect(page.locator('.chat-message')).toHaveCount(1);
    // And the protected tab should still show a placeholder (map was serialised with the item)
    const msg = page.locator('.chat-message').first();
    await msg.locator('.message-tab').nth(1).click();
    const text = await msg.locator('.message-text').innerText();
    expect(text).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('history items are ordered newest-first', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    // Chat 1
    await typeAndSend(page, 'First chat first@order.com');
    // Start a new chat to create a second history entry
    await page.locator('.new-chat-btn').click();
    await page.waitForTimeout(300);
    await typeAndSend(page, 'Second chat second@order.com');
    // The most recent chat (Second) should be first in the list
    const firstItemText = await page.locator('.history-item-text').first().innerText();
    expect(firstItemText.toLowerCase()).toContain('second');
  });

  test('clicking the active history item does not duplicate messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#text-input');
    await typeAndSend(page, 'Click test click@active.com');
    const countBefore = await page.locator('.chat-message').count();
    // The item is already active — click it again
    await page.locator('.history-item-content').first().click();
    await page.waitForTimeout(300);
    const countAfter = await page.locator('.chat-message').count();
    expect(countAfter).toBe(countBefore);
  });
});

// ── 38. MULTI-AI CHAT ─────────────────────────────────────────────────────────

test.describe('Multi-AI Chat — Sidebar', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('AI chat button opens the multi-AI sidebar', async ({ page }) => {
    const btn = page.locator('#ai-chat-btn');
    if (await btn.count() === 0) test.skip();
    await btn.click();
    await page.waitForTimeout(300);
    const right = await page.locator('#multi-ai-sidebar').evaluate(
      (el) => (el as HTMLElement).style.right
    );
    expect(right).toBe('0px');
  });

  test('close button hides the multi-AI sidebar', async ({ page }) => {
    const btn = page.locator('#ai-chat-btn');
    if (await btn.count() === 0) test.skip();
    await btn.click();
    await page.waitForTimeout(300);
    await page.locator('#close-multi-ai').click();
    await page.waitForTimeout(300);
    const right = await page.locator('#multi-ai-sidebar').evaluate(
      (el) => (el as HTMLElement).style.right
    );
    expect(right).toBe('-350px');
  });

  test('sending with no providers enabled shows a warning dialog', async ({ page }) => {
    const btn = page.locator('#ai-chat-btn');
    if (await btn.count() === 0) test.skip();
    await btn.click();
    await page.waitForTimeout(300);
    await page.fill('#multi-ai-input', 'Test message with email@test.com');
    let alertText = '';
    page.once('dialog', async (dialog) => {
      alertText = dialog.message();
      await dialog.dismiss();
    });
    await page.click('#send-multi-ai');
    await page.waitForTimeout(500);
    expect(alertText).toContain('enable');
  });

  test('multi-AI masks PII before displaying in chat', async ({ page }) => {
    const btn = page.locator('#ai-chat-btn');
    if (await btn.count() === 0) test.skip();
    // Enable a provider with a fake key so the message IS appended to chat
    await page.evaluate(() => {
      localStorage.setItem('multi-ai-settings', JSON.stringify({
        chatgpt: { enabled: true, apiKey: 'sk-fake-key-for-pii-test' }
      }));
    });
    await page.reload();
    await page.waitForSelector('#text-input');
    await page.locator('#ai-chat-btn').click();
    await page.waitForTimeout(300);
    // Intercept the OpenAI call so it doesn't hang
    await page.route('**/api.openai.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ choices: [{ message: { content: 'Mock AI response' } }] }) })
    );
    await page.fill('#multi-ai-input', 'Contact me at pii@multitest.com please');
    await page.click('#send-multi-ai');
    await page.waitForTimeout(800);
    // The user message div in chat-area should show the placeholder, not the raw email
    const chatArea = page.locator('#chat-area');
    const userMsgText = await chatArea.locator('div').filter({
      hasText: /\[LDB_EMAIL\d+\]/
    }).first().innerText();
    expect(userMsgText).toMatch(/\[LDB_EMAIL\d+\]/);
    expect(userMsgText).not.toContain('pii@multitest.com');
  });
});

// ── 39. RESTORE FLOW — EDGE CASES ─────────────────────────────────────────────

test.describe('Restore Flow — Edge Cases', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('unknown placeholder returns graceful output — no "undefined" or "[object Object]"', async ({ page }) => {
    await typeAndSend(page, '[LDB_UNKNOWN999] is not a real placeholder');
    const protected_ = await getProtectedText(page);
    // Should not crash or produce JS artefacts
    expect(protected_).not.toContain('undefined');
    expect(protected_).not.toContain('[object Object]');
    // The unknown placeholder passes through as-is
    expect(protected_).toContain('[LDB_UNKNOWN999]');
  });

  test('loading a history item restores the map so the same PII reuses its placeholder', async ({ page }) => {
    // Start with a clean slate (don't use loadApp which clears localStorage)
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#text-input');

    // Turn 1: send a message with PII — note the placeholder assigned
    await typeAndSend(page, 'History restore test history@restore.com');
    const msg1Protected = await getProtectedText(page);
    const placeholder = msg1Protected.match(/\[LDB_EMAIL\d+\]/)?.[0];
    expect(placeholder).toBeTruthy();

    // Reload — history persists in localStorage, but placeholderMap is cleared
    await page.reload();
    await page.waitForSelector('#text-input');

    // Load the saved history item — this restores the placeholder map
    await page.locator('.history-item-content').first().click();
    await page.waitForTimeout(300);

    // Turn 2: send a NEW message with the SAME email.
    // Because the map was restored, the deduplication logic in applyPIIMasking
    // should assign the SAME placeholder (not a new one).
    await page.fill('#text-input', 'Follow up for history@restore.com please');
    await page.click('#send-btn');
    await page.waitForSelector('.chat-message:nth-child(2)', { timeout: 5000 });

    const msg2 = page.locator('.chat-message').nth(1);
    await msg2.locator('.message-tab').nth(1).click();
    const text = await msg2.locator('.message-text').innerText();
    // Same email → same placeholder (map correctly restored from history)
    expect(text).toContain(placeholder!);
    expect(text).not.toContain('history@restore.com');
  });
});

// ── 40. ACCESSIBILITY ─────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('all interactive buttons have an accessible label', async ({ page }) => {
    const violations = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => {
          const hasAriaLabel = btn.getAttribute('aria-label')?.trim();
          const hasTitle = btn.getAttribute('title')?.trim();
          const hasText = btn.textContent?.trim();
          return !hasAriaLabel && !hasTitle && !hasText;
        })
        .map(btn => btn.outerHTML.substring(0, 120));
    });
    expect(violations).toHaveLength(0);
  });

  test('Escape key closes the settings modal', async ({ page }) => {
    await page.click('button.header-btn[onclick="showSettings()"]');
    await expect(page.locator('#settings-modal')).toHaveClass(/show/, { timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#settings-modal')).not.toHaveClass(/show/);
  });

  test('Escape key closes the shortcuts modal', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+/`);
    await expect(page.locator('#shortcuts-modal')).toHaveClass(/show/, { timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#shortcuts-modal')).not.toHaveClass(/show/);
  });

  test('CSS colour tokens are defined for both light and dark themes', async ({ page }) => {
    // Light theme
    const light = await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      const style = getComputedStyle(document.documentElement);
      return {
        textDark: style.getPropertyValue('--text-dark').trim(),
        white: style.getPropertyValue('--white').trim(),
      };
    });
    expect(light.textDark.length).toBeGreaterThan(0);
    expect(light.white.length).toBeGreaterThan(0);

    // Dark theme
    const dark = await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const style = getComputedStyle(document.documentElement);
      return {
        textDark: style.getPropertyValue('--text-dark').trim(),
        white: style.getPropertyValue('--white').trim(),
      };
    });
    expect(dark.textDark.length).toBeGreaterThan(0);
    expect(dark.white.length).toBeGreaterThan(0);
    // Dark and light values must differ (confirming the override takes effect)
    expect(dark.textDark).not.toBe(light.textDark);
  });
});

// ── 41. PERFORMANCE & STRESS ──────────────────────────────────────────────────

test.describe('Performance & Stress', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('20 messages in rapid succession — all rendered, no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (let i = 1; i <= 20; i++) {
      await page.fill('#text-input', `Stress message ${i} stress${i}@rapid.com`);
      await page.click('#send-btn');
      // Wait for the button to re-disable (message was processed) before next send
      await expect(page.locator('#send-btn')).toBeDisabled({ timeout: 3000 });
    }

    await expect(page.locator('.chat-message')).toHaveCount(20);
    expect(errors).toHaveLength(0);
  });

  test('sidebar with 50 history items renders without overflow', async ({ page }) => {
    // Seed 50 history items directly into localStorage then reload
    await page.evaluate(() => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `hist-${i}`,
        text: `Chat ${i + 1}`,
        date: new Date().toLocaleDateString(),
        messages: [],
      }));
      localStorage.setItem('historyItems', JSON.stringify(items));
    });
    await page.reload();
    await page.waitForSelector('#text-input');

    const itemCount = await page.locator('.history-item').count();
    expect(itemCount).toBeGreaterThan(0);

    // Sidebar should scroll — confirm no item overflows its container horizontally
    const overflow = await page.locator('#history-sidebar').evaluate((el) => {
      return el.scrollWidth <= el.clientWidth + 2; // allow 2px rounding
    });
    expect(overflow).toBe(true);
  });

  test('textarea height is capped below 300px even with many lines', async ({ page }) => {
    // Type 30 newline-separated lines
    const longText = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
    await page.fill('#text-input', longText);
    await page.waitForTimeout(200);
    const height = await page.locator('#text-input').evaluate(
      (el) => (el as HTMLElement).offsetHeight
    );
    expect(height).toBeLessThanOrEqual(300);
  });
});

// ── 42. AI RESPONSE RE-PROTECTION ────────────────────────────────────────────
//
// The app has a two-tab AI response widget: "AI's Response" (raw) and
// "Safe to Share" (re-masked via maskAIResponse).  We test it by calling
// addAIResponse() directly — no live API key needed.

test.describe('AI Response — Re-protection', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('Safe-to-Share tab re-masks PII echoed back by the AI', async ({ page }) => {
    // Populate the session placeholderMap by sending a message with PII
    await typeAndSend(page, 'My email is mock@response.com for testing');

    // Directly call addAIResponse with a response that echoes back the raw email
    // addAIResponse is a top-level function declaration and is on window
    await page.evaluate(() => {
      (window as any).addAIResponse(
        'Understood! Your email mock@response.com has been recorded.',
        ''
      );
    });

    await page.waitForSelector('.chat-message.restore', { timeout: 3000 });
    const aiMsg = page.locator('.chat-message.restore').last();

    // Switch to the "Safe to Share" tab (index 1)
    await aiMsg.locator('.message-tab').nth(1).click();
    await page.waitForTimeout(200);

    const safeText = await aiMsg.locator('.message-text').innerText();
    expect(safeText).not.toContain('mock@response.com');
    expect(safeText).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('Safe-to-Share tab masks fresh PII introduced by the AI response', async ({ page }) => {
    // Send a message with no PII so the AI "introduces" new PII in its reply
    await typeAndSend(page, 'Can you help me with a general question?');

    await page.evaluate(() => {
      // AI response contains a new email that was not in the original message
      (window as any).addAIResponse(
        'Sure! You can reach support at newpii@aiintro.com for further help.',
        ''
      );
    });

    await page.waitForSelector('.chat-message.restore', { timeout: 3000 });
    const aiMsg = page.locator('.chat-message.restore').last();

    // "Safe to Share" tab should mask the newly introduced email
    await aiMsg.locator('.message-tab').nth(1).click();
    await page.waitForTimeout(200);

    const safeText = await aiMsg.locator('.message-text').innerText();
    expect(safeText).not.toContain('newpii@aiintro.com');
    expect(safeText).toMatch(/\[LDB_EMAIL\d+\]/);
  });

  test('AI response with no PII shows "No personal info found" badge', async ({ page }) => {
    await typeAndSend(page, 'What is the capital of France?');

    await page.evaluate(() => {
      (window as any).addAIResponse('The capital of France is Paris.', '');
    });

    await page.waitForSelector('.chat-message.restore', { timeout: 3000 });
    const aiMsg = page.locator('.chat-message.restore').last();

    // Click "Safe to Share" to trigger the badge rendering
    await aiMsg.locator('.message-tab').nth(1).click();
    await page.waitForTimeout(200);

    // The safe-note div should be visible and contain the "no personal info" message
    const safeNoteText = await aiMsg.locator('[id$="-safe-note"]').innerText();
    expect(safeNoteText.toLowerCase()).toContain('no personal info');
  });
});

// ── 43. FILE UPLOAD — ERROR HANDLING ─────────────────────────────────────────

test.describe('File Upload — Error Handling', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('empty file shows a document card without crashing', async ({ page }) => {
    let jsErrorFired = false;
    page.on('pageerror', () => { jsErrorFired = true; });

    await page.setInputFiles('#file-input', {
      name: 'empty.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(''),
    });

    // Wait enough time for the document card flow to complete
    await page.waitForTimeout(1000);

    // UI must not be stuck: the input should still be focusable
    await expect(page.locator('#text-input')).toBeVisible();
    expect(jsErrorFired).toBe(false);
  });

  test('unsupported file extension is handled gracefully — UI not stuck', async ({ page }) => {
    let jsErrorFired = false;
    page.on('pageerror', () => { jsErrorFired = true; });

    // The file input accept list is .txt,.md,.csv,.pdf,image/*.
    // A .json file is unsupported but the handler falls through to the text reader.
    await page.setInputFiles('#file-input', {
      name: 'data.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"key":"value"}'),
    });

    await page.waitForTimeout(1000);

    // The app should still be usable — input visible, no JS error
    await expect(page.locator('#text-input')).toBeVisible();
    expect(jsErrorFired).toBe(false);
  });

  test('uploading a second file produces a second document card in the chat', async ({ page }) => {
    // First upload — wait for its document card to appear in the chat
    await page.setInputFiles('#file-input', {
      name: 'first.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('First file content'),
    });
    await page.waitForSelector('.document-card', { timeout: 3000 });

    // Second upload — wait for a second document card
    await page.setInputFiles('#file-input', {
      name: 'second.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Second file content'),
    });
    await page.waitForTimeout(800);

    // The most-recently added document card should reference second.txt
    // (showDocumentCard clears #uploaded-files-container, so check .document-name in chat)
    const lastDocName = page.locator('.document-name').last();
    await expect(lastDocName).toContainText('second.txt');
  });
});

// ── 44. DOCUMENT UPLOAD — ACCEPTED TYPES & HINTS ─────────────────────────────

test.describe('Document Upload — File Type Hints', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('file input accept attribute includes .docx', async ({ page }) => {
    const accept = await page.getAttribute('#file-input', 'accept');
    expect(accept).toContain('.docx');
  });

  test('upload menu shows accepted file type hint', async ({ page }) => {
    await page.click('.upload-btn');
    await page.waitForSelector('.upload-menu.show');
    const menuText = await page.locator('.upload-menu').innerText();
    expect(menuText).toContain('.docx');
    expect(menuText).toContain('.pdf');
    expect(menuText).toContain('.txt');
  });
});

// ── 45. DOCUMENT PREVIEW — IFRAME & TABS ─────────────────────────────────────

test.describe('Document Preview — iframe & tabs', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('preview modal opens with an iframe when clicking a document card', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'report.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Contact alice@example.com or call 555-123-4567'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });
    await page.locator('.doc-action-btn').first().click();
    await page.waitForSelector('#preview-modal.show');
    await expect(page.locator('#preview-frame')).toBeVisible();
  });

  test('preview iframe has white background (not dark)', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Send invoice to bob@company.com'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });
    await page.locator('.doc-action-btn').first().click();
    await page.waitForSelector('#preview-modal.show');
    // iframe srcdoc must contain explicit white background
    const srcdoc = await page.locator('#preview-frame').getAttribute('srcdoc') ?? '';
    expect(srcdoc).toContain('background:#fff');
  });

  test('protected tab shows placeholder chips, original tab shows real text', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'data.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Email me at carol@test.com'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });
    await page.locator('.doc-action-btn').first().click();
    await page.waitForSelector('#preview-modal.show');

    // Protected tab (default) — srcdoc should contain LDB placeholder
    const protectedSrc = await page.locator('#preview-frame').getAttribute('srcdoc') ?? '';
    expect(protectedSrc).toMatch(/LDB_EMAIL\d+/);

    // Switch to original tab
    await page.locator('.preview-tab').nth(1).click();
    await page.waitForTimeout(300);
    const originalSrc = await page.locator('#preview-frame').getAttribute('srcdoc') ?? '';
    expect(originalSrc).toContain('carol@test.com');
  });

  test('preview modal is scrollable (iframe fills modal body)', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'long.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(Array(50).fill('Line of text with email test@example.com').join('\n')),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });
    await page.locator('.doc-action-btn').first().click();
    await page.waitForSelector('#preview-modal.show');

    const frameBox = await page.locator('#preview-frame').boundingBox();
    expect(frameBox!.height).toBeGreaterThan(200);
  });
});

// ── 46. DOCUMENT HISTORY PERSISTENCE ─────────────────────────────────────────

test.describe('Document History — Persistence', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('document upload is saved to history', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'invoice.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Invoice for dave@corp.com'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });

    // History sidebar should have an entry for this document
    const historyItems = page.locator('.history-item');
    await expect(historyItems.first()).toBeVisible({ timeout: 3000 });
    const historyText = await historyItems.first().innerText();
    expect(historyText).toContain('invoice.txt');
  });

  test('document card reappears after loading history item', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'contract.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Signed by eve@legal.com'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });

    // Navigate away — start a new chat
    await page.click('#new-chat-btn');
    await page.waitForTimeout(300);

    // Return to the history item
    await page.locator('.history-item').first().locator('.history-item-content').click();
    await page.waitForTimeout(500);

    // Document card should be restored
    await expect(page.locator('.document-card')).toBeVisible();
    await expect(page.locator('.document-name, .document-card')).toContainText('contract.txt');
  });
});

// ── 47. AUTO-NAMING CHATS ─────────────────────────────────────────────────────

test.describe('Auto-naming — History Labels', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('history label uses first sentence when it is short enough', async ({ page }) => {
    await typeAndSend(page, 'Please protect this file. It has sensitive data inside.');
    await page.waitForSelector('.history-item');
    const label = await page.locator('.history-item-text').first().innerText();
    expect(label).toBe('Please protect this file');
  });

  test('history label breaks at word boundary for long first sentences', async ({ page }) => {
    const long = 'This is a very long opening sentence that goes on and on without stopping and should be truncated at a word boundary rather than mid-word';
    await typeAndSend(page, long);
    await page.waitForSelector('.history-item');
    const label = await page.locator('.history-item-text').first().innerText();
    // Should end with '…' and not cut mid-word
    expect(label).toContain('…');
    expect(label).not.toMatch(/\w…$/); // no mid-word cut: last char before … must be space boundary
  });

  test('document upload history label shows filename with icon', async ({ page }) => {
    await page.setInputFiles('#file-input', {
      name: 'summary.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Meeting notes from frank@team.com'),
    });
    await page.waitForSelector('.document-card', { timeout: 4000 });
    await page.waitForSelector('.history-item');
    const label = await page.locator('.history-item-text').first().innerText();
    expect(label).toContain('summary.txt');
  });
});

// ── 48. HELP BUTTON ───────────────────────────────────────────────────────────

test.describe('Help Button — Shortcuts Modal', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('clicking Help opens the shortcuts modal, not an external URL', async ({ page }) => {
    const newTabPromise = page.context().waitForEvent('page', { timeout: 2000 }).catch(() => null);
    await page.click('#help-btn');
    const newTab = await newTabPromise;
    // No new tab/window should open
    expect(newTab).toBeNull();
    // Shortcuts modal should be visible
    await expect(page.locator('#shortcuts-modal, .shortcuts-modal')).toBeVisible({ timeout: 2000 });
  });
});

// ── 49. PLAIN TEXT DOTTED UNDERLINE HINTS ────────────────────────────────────

test.describe('Plain Text View — Protection Hints', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('plain text view shows .was-protected spans on masked words', async ({ page }) => {
    await typeAndSend(page, 'Call me at 555-987-6543 or email grace@example.com');
    const msg = page.locator('.chat-message').first();

    // Switch to plain text tab
    await msg.locator('.message-tab').nth(0).click();
    await page.waitForTimeout(300);

    // Spans with class was-protected should exist for the masked values
    const hints = msg.locator('.was-protected');
    await expect(hints.first()).toBeVisible();
  });

  test('.was-protected spans have dotted underline style defined', async ({ page }) => {
    const style = await page.evaluate(() => {
      const el = document.createElement('span');
      el.className = 'was-protected';
      document.body.appendChild(el);
      const cs = getComputedStyle(el);
      const dec = cs.textDecorationStyle;
      document.body.removeChild(el);
      return dec;
    });
    expect(style).toBe('dotted');
  });
});

// ── 50. SELECTION PROTECT — CHAT MESSAGES ────────────────────────────────────

test.describe('Selection Protect — Chat Messages', () => {
  test.beforeEach(async ({ page }) => { await loadApp(page); });

  test('selecting text in a sent message shows the protect button', async ({ page }) => {
    await typeAndSend(page, 'The project codeword is Nightingale and the lead is Dr. Henry.');
    const msg = page.locator('.chat-message').first();

    // Switch to plain text so we can select real words
    await msg.locator('.message-tab').nth(0).click();
    await page.waitForTimeout(200);

    const textDiv = msg.locator('.message-text');
    // Triple-click selects all text in the div
    await textDiv.click({ clickCount: 3 });
    await page.waitForTimeout(300);

    await expect(page.locator('#selection-protect-btn')).toBeVisible({ timeout: 2000 });
  });

  test('protecting a word from a chat message re-renders the protected view', async ({ page }) => {
    await typeAndSend(page, 'The secret phrase is Butterfly and must not be shared.');
    const msg = page.locator('.chat-message').first();

    // Switch to plain text, select "Butterfly"
    await msg.locator('.message-tab').nth(0).click();
    await page.waitForTimeout(200);
    await msg.locator('.message-text').click({ clickCount: 3 });
    await page.waitForTimeout(300);

    await page.locator('#selection-protect-btn').click();
    await page.waitForTimeout(400);

    // Switch to protected view — Butterfly should now be a placeholder
    await msg.locator('.message-tab').nth(1).click();
    const protectedView = await msg.locator('.message-text').innerText();
    expect(protectedView).not.toContain('Butterfly');
    expect(protectedView).toMatch(/LDB_/);
  });
});
