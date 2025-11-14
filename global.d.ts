// global.d.ts
export {};
declare global { interface Window {
  pii: {
    mask: (text: string, customTerms?: string[], sessionId?: string) => Promise<{ maskedText: string; placeholders: Record<string, string> }>;
    unmask: (text: string) => Promise<{ restoredText: string }>;
    clear: () => Promise<{ ok: boolean }>;
  };
}};
