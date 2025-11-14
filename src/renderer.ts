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
      let answer = `Echo: ${payload}`;

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// if replacing, then show protected prompt and disappear the restored result.
// else show restored result and disappear protected prompt.