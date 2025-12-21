/**
 * @fileoverview Renderer process for Ledebe Protector application.
 * Handles UI interactions, PII protection, feedback, and template management.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

import { WebAnonymizer } from './pii/WebAnonymizer';

const fallback = new WebAnonymizer();

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

function init() {
  const protect = byId<HTMLInputElement>('protect');
  const darkMode = byId<HTMLInputElement>('darkMode');
  const inputEl = byId<HTMLTextAreaElement>('input');
  const outputEl = byId<HTMLTextAreaElement>('output');
  const protectedPromptEl = byId<HTMLTextAreaElement>('protected-prompt');
  const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
  const sendBtn = byId<HTMLButtonElement>('send');
  const shield = byId<HTMLSpanElement>('shield');

  // Dark mode toggle
  darkMode.addEventListener('change', () => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode.checked ? 'dark' : 'light'
    );
    localStorage.setItem('darkMode', darkMode.checked.toString());
  });

  // Load saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  darkMode.checked = savedDarkMode;
  document.documentElement.setAttribute(
    'data-theme',
    savedDarkMode ? 'dark' : 'light'
  );

  sendBtn.addEventListener('click', async () => {
    try {
      const text = inputEl.value;
      const customTerms = (customTermsEl.value || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      let payload = text;
      let maskedCount = 0;

      // @ts-ignore
      const pii = (window as any).pii;

      if (protect.checked) {
        if (pii?.mask) {
          const { maskedText, placeholders } = await pii.mask(
            text,
            customTerms,
            'conv-1'
          );
          payload = maskedText;
          maskedCount = Object.keys(placeholders).length;
        } else {
          fallback.setCustomTerms(customTerms);
          const { maskedText, placeholders } = fallback.mask(text);
          payload = maskedText;
          maskedCount = Object.keys(placeholders).length;
        }
      }

      shield.textContent = maskedCount ? `🛡️ protected: ${maskedCount}` : '';
      protectedPromptEl.value = payload;

      let answer = `${payload}`;

      if (protect.checked) {
        if (pii?.unmask) {
          const { restoredText } = await pii.unmask(answer);
          answer = restoredText;
        } else {
          const { restoredText } = fallback.unmask(answer);
          answer = restoredText;
        }
      }

      outputEl.value = answer;
    } catch (e) {
      console.error(e);
      alert('Error, see DevTools');
    }
  });

  setupFeedback();
  setupTemplateHandlers();
  setupSettingsHandlers();
  setupCopyButtons();
  loadSettings();
}

function setupFeedback() {
  const feedbackBtn = byId<HTMLButtonElement>('send-feedback');
  const feedbackText = byId<HTMLInputElement>('feedback-text');

  feedbackBtn.addEventListener('click', async () => {
    const message = feedbackText.value.trim();
    if (!message) {
      alert('Please enter your feedback');
      return;
    }

    feedbackBtn.disabled = true;
    feedbackBtn.textContent = 'Sending...';

    try {
      // @ts-ignore
      const feedback = (window as any).feedback;
      const result = await feedback.send(message);

      if (result.success) {
        alert('Thank you for your feedback!');
        feedbackText.value = '';
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      alert('Failed to send feedback. Please try again.');
    } finally {
      feedbackBtn.disabled = false;
      feedbackBtn.textContent = 'Send Feedback';
    }
  });
}

function setupTemplateHandlers() {
  window.addEventListener('menu-save-template', showSaveTemplateDialog);
  window.addEventListener('menu-load-template', showLoadTemplateDialog);
  window.addEventListener('menu-clear-all', clearAllFields);
}

function setupSettingsHandlers() {
  const settingsBtn = byId<HTMLButtonElement>('settings-btn');
  const settingsModal = byId<HTMLDivElement>('settings-modal');
  const closeSettings = byId<HTMLButtonElement>('close-settings');
  const cancelSettings = byId<HTMLButtonElement>('cancel-settings');
  const saveSettings = byId<HTMLButtonElement>('save-settings');
  
  settingsBtn.addEventListener('click', showSettingsModal);
  closeSettings.addEventListener('click', hideSettingsModal);
  cancelSettings.addEventListener('click', hideSettingsModal);
  saveSettings.addEventListener('click', saveSettingsData);
  
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      hideSettingsModal();
    }
  });
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const textarea = byId<HTMLTextAreaElement>(targetId!);

      try {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          throw new Error('Clipboard access requires secure context');
        }
        await navigator.clipboard.writeText(textarea.value);
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      } catch (error) {
        textarea.select();
        document.execCommand('copy');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    });
  });
}

function showSettingsModal() {
  const settingsModal = byId<HTMLDivElement>('settings-modal');
  settingsModal.style.display = 'block';
}

function hideSettingsModal() {
  const settingsModal = byId<HTMLDivElement>('settings-modal');
  settingsModal.style.display = 'none';
}

async function loadSettings() {
  try {
    // @ts-ignore
    const settings = (window as any).settings;
    if (settings?.load) {
      const result = await settings.load();
      if (result.success) {
        const settingsData = result.settings;
        
        const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
        if (settingsData.customTerms && settingsData.customTerms.length > 0) {
          customTermsEl.value = settingsData.customTerms.join('\n');
        }
        
        const settingsCustomTerms = byId<HTMLTextAreaElement>('settings-custom-terms');
        const autoSave = byId<HTMLInputElement>('settings-auto-save');
        const notifications = byId<HTMLInputElement>('settings-notifications');
        
        settingsCustomTerms.value = settingsData.customTerms ? settingsData.customTerms.join('\n') : '';
        autoSave.checked = settingsData.autoSave !== false;
        notifications.checked = settingsData.notifications !== false;
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function saveSettingsData() {
  try {
    const settingsCustomTerms = byId<HTMLTextAreaElement>('settings-custom-terms');
    const autoSave = byId<HTMLInputElement>('settings-auto-save');
    const notifications = byId<HTMLInputElement>('settings-notifications');
    
    const customTerms = (settingsCustomTerms.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    
    const settingsData = {
      customTerms,
      autoSave: autoSave.checked,
      notifications: notifications.checked,
      theme: 'system'
    };
    
    // @ts-ignore
    const settings = (window as any).settings;
    if (settings?.save) {
      const result = await settings.save(settingsData);
      if (result.success) {
        const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
        customTermsEl.value = customTerms.join('\n');
        
        alert('Settings saved successfully!');
        hideSettingsModal();
      } else {
        alert('Failed to save settings. Please try again.');
      }
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings. Please try again.');
  }
}

function showSaveTemplateDialog() {
  const name = prompt('Enter template name:');
  if (!name) return;
  
  const inputEl = byId<HTMLTextAreaElement>('input');
  const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
  
  const customTerms = (customTermsEl.value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  
  // @ts-ignore
  const templates = (window as any).templates;
  if (templates?.save) {
    templates.save(name, inputEl.value, customTerms)
      .then((result: any) => {
        if (result.success) {
          alert('Template saved successfully!');
        } else {
          alert('Failed to save template.');
        }
      })
      .catch(() => alert('Failed to save template.'));
  }
}

function showLoadTemplateDialog() {
  // @ts-ignore
  const templates = (window as any).templates;
  if (!templates?.list) return;
  
  templates.list()
    .then((result: any) => {
      if (result.success && result.templates.length > 0) {
        const templateName = prompt(`Available templates:\n${result.templates.join('\n')}\n\nEnter template name to load:`);
        if (!templateName) return;
        
        templates.load(templateName)
          .then((loadResult: any) => {
            if (loadResult.success && loadResult.template) {
              const inputEl = byId<HTMLTextAreaElement>('input');
              const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
              
              inputEl.value = loadResult.template.text;
              customTermsEl.value = loadResult.template.customTerms.join('\n');
              
              alert('Template loaded successfully!');
            } else {
              alert('Template not found.');
            }
          })
          .catch(() => alert('Failed to load template.'));
      } else {
        alert('No templates found.');
      }
    })
    .catch(() => alert('Failed to list templates.'));
}

function clearAllFields() {
  if (confirm('Clear all fields?')) {
    const inputEl = byId<HTMLTextAreaElement>('input');
    const outputEl = byId<HTMLTextAreaElement>('output');
    const protectedPromptEl = byId<HTMLTextAreaElement>('protected-prompt');
    const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
    const shield = byId<HTMLSpanElement>('shield');
    
    inputEl.value = '';
    outputEl.value = '';
    protectedPromptEl.value = '';
    customTermsEl.value = '';
    shield.textContent = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}