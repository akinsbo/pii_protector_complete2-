// src/renderer.ts
import { WebAnonymizer } from './pii/WebAnonymizer';

const fallback = new WebAnonymizer();

// ✅ typed helper
function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

function init() {
  console.log(`initinig`);
  const protect = byId<HTMLInputElement>('protect');
  const inputEl = byId<HTMLTextAreaElement>('input');
  const outputEl = byId<HTMLTextAreaElement>('output');
  const protectedPromptEl = byId<HTMLTextAreaElement>('protected-prompt');
  const customTermsEl = byId<HTMLTextAreaElement>('customTerms');
  const sendBtn = byId<HTMLButtonElement>('send');
  const shield = byId<HTMLSpanElement>('shield');

  sendBtn.addEventListener('click', async () => {
    try {
      const text = inputEl.value;
      const customTerms = (customTermsEl.value || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      let payload = text;
      let maskedCount = 0;

      // @ts-ignore — exposed by Electron preload in app runtime
      const pii = (window as any).pii;
      console.log(`text: ${text}, customTerms: ${customTerms}, pii: ${pii}`);

      if (protect.checked) {
        if (pii?.mask) {
          console.log(`true pii?.mask: ${pii?.mask}`);
          const { maskedText, placeholders } = await pii.mask(text, customTerms, 'conv-1');
          payload = maskedText;
          maskedCount = Object.keys(placeholders).length;
        } else {
          console.log(`false pii?.mask: ${pii?.mask}`);
          fallback.setCustomTerms(customTerms);
          const { maskedText, placeholders } = fallback.mask(text);
          payload = maskedText;
          maskedCount = Object.keys(placeholders).length;
        }
      }

      shield.textContent = maskedCount ? `🛡️ protected: ${maskedCount}` : '';
      console.log(`shield.textContent: ${shield.textContent}, maskedCount: ${maskedCount}, payload: ${payload}`);

      protectedPromptEl.value = payload;

      // demo: echo back
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

  // Feedback functionality
  const feedbackBtn = byId<HTMLButtonElement>('send-feedback');
  const feedbackText = byId<HTMLTextAreaElement>('feedback-text');
  const feedbackEmail = byId<HTMLInputElement>('feedback-email');

  feedbackBtn.addEventListener('click', async () => {
    const message = feedbackText.value.trim();
    if (!message) {
      alert('Please enter your feedback');
      return;
    }

    feedbackBtn.disabled = true;
    feedbackBtn.textContent = 'Sending...';

    try {
      // @ts-ignore — exposed by Electron preload
      const feedback = (window as any).feedback;
      
      // Validate secure connection before sending sensitive data
      if (feedback?.endpoint && !feedback.endpoint.startsWith('https://')) {
        throw new Error('Insecure connection: HTTPS required for feedback transmission');
      }
      
      const result = await feedback.send(message, feedbackEmail.value.trim());
      
      if (result.success) {
        alert('Thank you for your feedback!');
        feedbackText.value = '';
        feedbackEmail.value = '';
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

  // Copy button functionality
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const textarea = byId<HTMLTextAreaElement>(targetId!);
      
      try {
        // Ensure secure context for clipboard operations
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
        // Fallback for older browsers
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}