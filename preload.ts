// preload.ts
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pii', {
  mask: (text: string, customTerms?: string[], sessionId?: string) =>
    ipcRenderer.invoke('pii:mask', { text, customTerms, sessionId }),
  unmask: (text: string) => ipcRenderer.invoke('pii:unmask', { text }),
  clear: () => ipcRenderer.invoke('pii:clear'),
});

contextBridge.exposeInMainWorld('feedback', {
  send: (message: string, email?: string) =>
    ipcRenderer.invoke('feedback:send', { message, email }),
});
