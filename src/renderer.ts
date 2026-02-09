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
import './plugin-integration';
import { analytics } from './analytics';
import { AnalyticsDashboard } from './plugins/AnalyticsDashboard';
import { FeaturesShowcase } from './FeaturesShowcase';
import { notifications } from './notifications';

const fallback = new WebAnonymizer();

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function requireById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

function init() {
  const protect = document.getElementById('protect') as HTMLInputElement | null;
  const darkMode = requireById<HTMLInputElement>('darkMode');
  const inputEl = requireById<HTMLTextAreaElement>('input');
  const outputEl = requireById<HTMLTextAreaElement>('output');
  const protectedPromptEl = requireById<HTMLTextAreaElement>('protected-prompt');
  const customTermsEl = requireById<HTMLTextAreaElement>('customTerms');
  const aiChatBtn = requireById<HTMLButtonElement>('ai-chat-btn');
  const helpBtn = requireById<HTMLButtonElement>('help-btn');
  const showTutorialBtn = byId<HTMLButtonElement>('show-tutorial-btn');
  const gotItBtn = byId<HTMLButtonElement>('got-it-btn');
  const skipTutorialBtn = byId<HTMLButtonElement>('skip-tutorial-btn');
  const exitTutorialBtn = byId<HTMLButtonElement>('exit-tutorial-btn');
  const protectBtn = byId<HTMLButtonElement>('protect-btn');
  const addCustomTermsBtn = requireById<HTMLButtonElement>('add-custom-terms');
  const useWithAiBtn = requireById<HTMLButtonElement>('use-with-ai-btn');
  const startOverBtn = requireById<HTMLButtonElement>('start-over-btn');
  const restoreBtn = requireById<HTMLButtonElement>('restore-btn');
  const aiResponseInput = requireById<HTMLTextAreaElement>('ai-response-input');
  const nextStep1 = byId<HTMLButtonElement>('next-step-1');
  const prevStep2 = byId<HTMLButtonElement>('prev-step-2');
  const nextStep2 = byId<HTMLButtonElement>('next-step-2');
  const prevStep3 = byId<HTMLButtonElement>('prev-step-3');
  const nextStep3 = byId<HTMLButtonElement>('next-step-3');
  const prevStep4 = byId<HTMLButtonElement>('prev-step-4');

  // Initialize workflow
  initializeWorkflow();

  // Help and tutorial buttons
  helpBtn?.addEventListener('click', showHelpModal);
  
  showTutorialBtn?.addEventListener('click', () => {
    const welcomeGuide = document.getElementById('welcome-guide');
    const mainWorkflow = document.getElementById('main-workflow');
    if (welcomeGuide && mainWorkflow) {
      welcomeGuide.style.display = 'block';
      mainWorkflow.style.display = 'none';
      analytics.trackFeature('tutorial_reopened');
    }
  });

  // Welcome guide handlers
  gotItBtn?.addEventListener('click', () => {
    const welcomeGuide = document.getElementById('welcome-guide');
    const mainWorkflow = document.getElementById('main-workflow');
    if (welcomeGuide && mainWorkflow) {
      welcomeGuide.style.display = 'none';
      mainWorkflow.style.display = 'block';
      localStorage.setItem('hasSeenWelcomeGuide', 'true');
      analytics.trackFeature('welcome_guide_completed');
    }
  });

  skipTutorialBtn?.addEventListener('click', () => {
    const welcomeGuide = document.getElementById('welcome-guide');
    const mainWorkflow = document.getElementById('main-workflow');
    if (welcomeGuide && mainWorkflow) {
      welcomeGuide.style.display = 'none';
      mainWorkflow.style.display = 'block';
      localStorage.setItem('hasSeenWelcomeGuide', 'true');
      analytics.trackFeature('tutorial_skipped');
    }
  });

  exitTutorialBtn?.addEventListener('click', () => {
    const welcomeGuide = document.getElementById('welcome-guide');
    const mainWorkflow = document.getElementById('main-workflow');
    if (welcomeGuide && mainWorkflow) {
      welcomeGuide.style.display = 'none';
      mainWorkflow.style.display = 'block';
      localStorage.setItem('hasSeenWelcomeGuide', 'true');
      analytics.trackFeature('tutorial_exited');
    }
  });

  // AI Chat button handler
  aiChatBtn?.addEventListener('click', () => {
    analytics.trackFeature('ai_chat_button_clicked');
    // Trigger plugin system to show chat interface
    document.dispatchEvent(new CustomEvent('open-ai-chat'));
  });

  // Input change handler
  inputEl?.addEventListener('input', () => {
    const hasText = inputEl.value.trim().length > 0;
    if (protectBtn) protectBtn.disabled = !hasText;
    if (nextStep1) nextStep1.disabled = !hasText;
    
    if (protectBtn) {
      protectBtn.textContent = '🛡️ Protect My Info';
    }
  });

  // Custom terms toggle
  addCustomTermsBtn?.addEventListener('click', () => {
    const section = document.getElementById('custom-terms-section');
    if (section && addCustomTermsBtn) {
      const isVisible = section.style.display !== 'none';
      section.style.display = isVisible ? 'none' : 'block';
      addCustomTermsBtn.textContent = isVisible ? '+ Add Custom Terms to Protect' : '- Hide Custom Terms';
    }
  });

  // Protect button handler
  if (protectBtn) {
    protectBtn.addEventListener('click', async () => {
      await processProtection();
    });
  }

  // Use with AI button
  useWithAiBtn?.addEventListener('click', () => {
    // Show step 4 and open AI chat
    showStep(4);
    document.dispatchEvent(new CustomEvent('open-ai-chat'));
    analytics.trackFeature('use_with_ai_clicked');
  });

  // Start over button
  startOverBtn?.addEventListener('click', () => {
    resetWorkflow();
    analytics.trackFeature('start_over_clicked');
  });

  // AI response input handler
  aiResponseInput?.addEventListener('input', () => {
    const hasText = aiResponseInput.value.trim().length > 0;
    if (restoreBtn) restoreBtn.disabled = !hasText;
  });

  // Restore button handler
  restoreBtn?.addEventListener('click', async () => {
    await processRestore();
  });

  // Navigation handlers
  if (nextStep1) {
    nextStep1.addEventListener('click', () => {
      if (inputEl.value.trim()) {
        showStep(2);
      }
    });
  }

  if (prevStep2) {
    prevStep2.addEventListener('click', () => {
      showStep(1);
    });
  }

  if (nextStep2) {
    nextStep2.addEventListener('click', async () => {
      await processProtection();
    });
  }

  if (prevStep3) {
    prevStep3.addEventListener('click', () => {
      showStep(2);
    });
  }

  if (nextStep3) {
    nextStep3.addEventListener('click', () => {
      showStep(4);
    });
  }

  if (prevStep4) {
    prevStep4.addEventListener('click', () => {
      showStep(3);
    });
  }

  // Dark mode toggle
  darkMode?.addEventListener('change', () => {
    const theme = darkMode.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('darkMode', darkMode.checked.toString());
  });

  // Load saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    darkMode.checked = savedDarkMode;
    document.documentElement.setAttribute(
      'data-theme',
      savedDarkMode ? 'dark' : 'light'
    );
  }

  setupFeedback();
  setupTemplateHandlers();
  setupSettingsHandlers();
  setupCopyButtons();
  loadSettings();
  setupTermCounters();
}

function initializeWorkflow() {
  // Check if user has seen welcome guide
  const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide') === 'true';
  const welcomeGuide = document.getElementById('welcome-guide');
  const mainWorkflow = document.getElementById('main-workflow');
  
  if (welcomeGuide && mainWorkflow) {
    if (hasSeenGuide) {
      welcomeGuide.style.display = 'none';
      mainWorkflow.style.display = 'block';
    } else {
      // Show welcome guide for first-time users
      welcomeGuide.style.display = 'block';
      mainWorkflow.style.display = 'none';
    }
  }
}

function showStep(stepNumber: number) {
  // Hide all steps
  document.querySelectorAll('.workflow-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show target step
  const targetStep = document.getElementById(`step-${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
    targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function processProtection() {
  const inputEl = requireById<HTMLTextAreaElement>('input');
  const protectedPromptEl = requireById<HTMLTextAreaElement>('protected-prompt');
  const customTermsEl = requireById<HTMLTextAreaElement>('customTerms');
  const protectBtn = byId<HTMLButtonElement>('protect-btn');
  const protectionStatus = requireById<HTMLElement>('protection-status');

  try {
    const text = inputEl.value;
    const customTerms = (customTermsEl.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (protectBtn) {
      protectBtn.disabled = true;
      protectBtn.textContent = '🔄 Protecting...';
    }

    let payload = text;
    let maskedCount = 0;

    // @ts-ignore
    const pii = (window as any).pii;

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

    protectedPromptEl.value = payload;
    
    // Update protection status
    if (maskedCount > 0) {
      protectionStatus.textContent = `🛡️ Protected ${maskedCount} sensitive item${maskedCount > 1 ? 's' : ''}`;
      protectionStatus.style.background = 'var(--accent-green)';
    } else {
      protectionStatus.textContent = '✅ No sensitive info detected';
      protectionStatus.style.background = '#6c757d';
    }

    // Show step 3
    showStep(3);
    
    // Show success notification
    if (maskedCount > 0) {
      notifications.success(`Protected ${maskedCount} sensitive item${maskedCount > 1 ? 's' : ''}! Safe to use with AI.`);
    } else {
      notifications.info('No sensitive info detected. Text is ready to use.');
    }
    
    analytics.trackFeature('text_protected', { maskedCount });
    
  } catch (e) {
    console.error(e);
    notifications.error('Error protecting text. Please try again.');
  } finally {
    if (protectBtn) {
      protectBtn.disabled = false;
      protectBtn.textContent = '🛡️ Protect My Info';
    }
  }
}

async function processRestore() {
  const aiResponseInput = requireById<HTMLTextAreaElement>('ai-response-input');
  const outputEl = requireById<HTMLTextAreaElement>('output');
  const restoreBtn = requireById<HTMLButtonElement>('restore-btn');
  const restoredResult = requireById<HTMLElement>('restored-result');

  try {
    const text = aiResponseInput.value;
    
    restoreBtn.disabled = true;
    restoreBtn.textContent = '🔄 Restoring...';

    let answer = text;

    // @ts-ignore
    const pii = (window as any).pii;

    if (pii?.unmask) {
      const { restoredText } = await pii.unmask(answer);
      answer = restoredText;
    } else {
      const { restoredText } = fallback.unmask(answer);
      answer = restoredText;
    }

    outputEl.value = answer;
    restoredResult.style.display = 'block';
    
    // Show success notification
    notifications.success('Personal information restored successfully!');
    
    analytics.trackFeature('text_restored');
    
  } catch (e) {
    console.error(e);
    notifications.error('Error restoring text. Please try again.');
  } finally {
    restoreBtn.disabled = false;
    restoreBtn.textContent = '🔄 Restore Personal Info';
  }
}

function resetWorkflow() {
  // Clear all inputs
  const inputEl = requireById<HTMLTextAreaElement>('input');
  const protectedPromptEl = requireById<HTMLTextAreaElement>('protected-prompt');
  const aiResponseInput = requireById<HTMLTextAreaElement>('ai-response-input');
  const outputEl = requireById<HTMLTextAreaElement>('output');
  const customTermsEl = requireById<HTMLTextAreaElement>('customTerms');
  
  inputEl.value = '';
  protectedPromptEl.value = '';
  aiResponseInput.value = '';
  outputEl.value = '';
  
  // Reset buttons
  const protectBtn = byId<HTMLButtonElement>('protect-btn');
  const restoreBtn = requireById<HTMLButtonElement>('restore-btn');
  const nextStep1 = byId<HTMLButtonElement>('next-step-1');
  
  if (protectBtn) protectBtn.disabled = true;
  restoreBtn.disabled = true;
  if (nextStep1) nextStep1.disabled = true;
  
  // Hide custom terms if visible
  const customTermsSection = document.getElementById('custom-terms-section')!;
  const addCustomTermsBtn = requireById<HTMLButtonElement>('add-custom-terms');
  customTermsSection.style.display = 'none';
  addCustomTermsBtn.textContent = '+ Add Custom Terms to Protect';
  
  // Hide restored result
  const restoredResult = document.getElementById('restored-result')!;
  restoredResult.style.display = 'none';
  
  // Show step 1
  showStep(1);
}

function showHelpModal() {
  const helpModal = document.createElement('div');
  helpModal.className = 'help-modal';
  helpModal.innerHTML = `
    <div class="help-content">
      <button class="close-help">&times;</button>
      <h3>🛡️ How Ledebe Protector Works</h3>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🎯 What it does:</h4>
        <p>Automatically detects and hides your personal information before you share text with AI tools, then restores it back when needed.</p>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🔍 What we protect:</h4>
        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
          <li>Email addresses (john@company.com → [[LDB:EMAIL_1]])</li>
          <li>Phone numbers (+1-555-123-4567 → [[LDB:PHONE_1]])</li>
          <li>Names and personal identifiers</li>
          <li>Credit card numbers</li>
          <li>Custom terms you specify</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h4>🚀 Quick Start:</h4>
        <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
          <li>Paste your text in the input box</li>
          <li>Click "Protect My Info" to hide sensitive data</li>
          <li>Copy the protected text to use with AI</li>
          <li>Paste AI's response back to restore your info</li>
        </ol>
      </div>
      
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
        <strong>💡 Pro Tip:</strong> Use the "AI Chat" button for direct, protected conversations with ChatGPT and other AI models!
      </div>
      
      <div style="text-align: center;">
        <button class="primary-btn" onclick="this.closest('.help-modal').remove()">Got it!</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(helpModal);
  
  // Close handlers
  const closeBtn = helpModal.querySelector('.close-help');
  closeBtn?.addEventListener('click', () => helpModal.remove());
  
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.remove();
  });
  
  analytics.trackFeature('help_modal_opened');
}

function setupFeedback() {
  const feedbackBtn = byId<HTMLButtonElement>('send-feedback');
  const feedbackText = byId<HTMLInputElement>('feedback-text');

  if (!feedbackBtn || !feedbackText) return;

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
        notifications.success('Thank you for your feedback!');
        feedbackText.value = '';
      } else {
        notifications.error('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      notifications.error('Failed to send feedback. Please try again.');
    } finally {
      feedbackBtn.disabled = false;
      feedbackBtn.textContent = 'Send';
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
  const viewAnalytics = byId<HTMLButtonElement>('view-analytics');
  
  if (!settingsBtn || !settingsModal || !closeSettings || !cancelSettings || !saveSettings || !viewAnalytics) return;
  
  settingsBtn.addEventListener('click', showSettingsModal);
  closeSettings.addEventListener('click', hideSettingsModal);
  cancelSettings.addEventListener('click', hideSettingsModal);
  saveSettings.addEventListener('click', saveSettingsData);
  
  viewAnalytics.addEventListener('click', () => {
    const dashboard = new AnalyticsDashboard();
    dashboard.show();
    analytics.trackFeature('analytics_dashboard_opened');
  });
  
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
      if (!targetId) return;
      
      const textarea = byId<HTMLTextAreaElement>(targetId);
      if (!textarea) return;

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
  if (settingsModal) settingsModal.style.display = 'block';
}

function hideSettingsModal() {
  const settingsModal = byId<HTMLDivElement>('settings-modal');
  if (settingsModal) settingsModal.style.display = 'none';
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
        if (settingsData.customTerms && settingsData.customTerms.length > 0 && customTermsEl) {
          customTermsEl.value = settingsData.customTerms.join('\n');
        }
        
        const settingsCustomTerms = byId<HTMLTextAreaElement>('settings-custom-terms');
        const autoSave = byId<HTMLInputElement>('settings-auto-save');
        const notificationsEl = byId<HTMLInputElement>('settings-notifications');
        const analyticsEnabled = byId<HTMLInputElement>('settings-analytics');
        
        if (settingsCustomTerms) settingsCustomTerms.value = settingsData.customTerms ? settingsData.customTerms.join('\n') : '';
        if (autoSave) autoSave.checked = settingsData.autoSave !== false;
        if (notificationsEl) notificationsEl.checked = settingsData.notifications !== false;
        if (analyticsEnabled) analyticsEnabled.checked = settingsData.analytics !== false;
        
        // Initialize analytics with saved setting
        analytics.setEnabled(settingsData.analytics !== false);
        
        // Update counters after loading settings
        const termsCounter = document.getElementById('terms-counter') as HTMLElement;
        if (customTermsEl && termsCounter) {
          const updateCounter = (window as any).updateCounter;
          if (updateCounter) updateCounter(customTermsEl, termsCounter);
        }
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
    const notificationsEl = byId<HTMLInputElement>('settings-notifications');
    const analyticsEnabled = byId<HTMLInputElement>('settings-analytics');
    
    if (!settingsCustomTerms || !autoSave || !notificationsEl || !analyticsEnabled) return;
    
    const customTerms = (settingsCustomTerms.value || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    
    const settingsData = {
      customTerms,
      autoSave: autoSave.checked,
      notifications: notificationsEl.checked,
      analytics: analyticsEnabled.checked,
      theme: 'system'
    };
    
    // Update analytics setting
    analytics.setEnabled(analyticsEnabled.checked);
    
    // @ts-ignore
    const settings = (window as any).settings;
    if (settings?.save) {
      const result = await settings.save(settingsData);
      if (result.success) {
        const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
        if (customTermsEl) customTermsEl.value = customTerms.join('\n');
        
        notifications.success('Settings saved successfully!');
        hideSettingsModal();
      } else {
        notifications.error('Failed to save settings. Please try again.');
      }
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    notifications.error('Failed to save settings. Please try again.');
  }
}

function showSaveTemplateDialog() {
  const name = prompt('Enter template name:');
  if (!name) return;
  
  const inputEl = byId<HTMLTextAreaElement>('input');
  const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
  
  if (!inputEl || !customTermsEl) return;
  
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
              
              if (inputEl) inputEl.value = loadResult.template.text;
              if (customTermsEl) customTermsEl.value = loadResult.template.customTerms.join('\n');
              
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
    
    if (inputEl) inputEl.value = '';
    if (outputEl) outputEl.value = '';
    if (protectedPromptEl) protectedPromptEl.value = '';
    if (customTermsEl) customTermsEl.value = '';
    
    const shield = document.getElementById('shield');
    if (shield) {
      shield.textContent = '';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function setupTermCounters() {
  const MAX_TERMS = 50;
  
  function updateCounter(textarea: HTMLTextAreaElement, counter: HTMLElement) {
    const terms = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    const count = terms.length;
    
    // For custom terms counter, add defaults count
    let totalCount = count;
    if (textarea.id === 'customTerms') {
      const settingsTerms = document.getElementById('settings-custom-terms') as HTMLTextAreaElement;
      if (settingsTerms) {
        const defaultTerms = settingsTerms.value.split('\n').map(s => s.trim()).filter(Boolean);
        totalCount = defaultTerms.length + count;
      }
    }
    
    counter.textContent = `${totalCount}/${MAX_TERMS}`;
    
    if (totalCount > MAX_TERMS) {
      counter.style.color = '#e74c3c';
      textarea.style.borderColor = '#e74c3c';
      // Truncate to limit
      const limitedTerms = terms.slice(0, MAX_TERMS);
      textarea.value = limitedTerms.join('\n');
      counter.textContent = `${MAX_TERMS}/${MAX_TERMS}`;
    } else if (totalCount > MAX_TERMS * 0.8) {
      counter.style.color = '#f39c12';
      textarea.style.borderColor = '';
    } else {
      counter.style.color = 'var(--text-gray)';
      textarea.style.borderColor = '';
    }
  }
  
  const customTerms = document.getElementById('customTerms') as HTMLTextAreaElement;
  const termsCounter = document.getElementById('terms-counter') as HTMLElement;
  const settingsTerms = document.getElementById('settings-custom-terms') as HTMLTextAreaElement;
  const settingsCounter = document.getElementById('settings-terms-counter') as HTMLElement;
  
  if (customTerms && termsCounter) {
    const updateCustomCounter = () => updateCounter(customTerms, termsCounter);
    customTerms.addEventListener('input', updateCustomCounter);
    customTerms.addEventListener('keyup', updateCustomCounter);
    customTerms.addEventListener('paste', () => setTimeout(updateCustomCounter, 10));
    // Force initial update with multiple attempts
    updateCounter(customTerms, termsCounter);
    setTimeout(() => updateCounter(customTerms, termsCounter), 100);
    setTimeout(() => updateCounter(customTerms, termsCounter), 500);
  }
  
  if (settingsTerms && settingsCounter) {
    settingsTerms.addEventListener('input', () => updateCounter(settingsTerms, settingsCounter));
    setTimeout(() => updateCounter(settingsTerms, settingsCounter), 100);
  }
  
  // Update custom terms counter when settings change
  if (settingsTerms && customTerms && termsCounter) {
    settingsTerms.addEventListener('input', () => {
      updateCounter(customTerms, termsCounter);
    });
  }
}