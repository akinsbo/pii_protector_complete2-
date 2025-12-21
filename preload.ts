/**
 * @fileoverview Preload script for Ledebe Protector Electron application.
 * Exposes secure APIs to the renderer process for PII protection and feedback.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

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

contextBridge.exposeInMainWorld('templates', {
  save: (name: string, text: string, customTerms: string[]) =>
    ipcRenderer.invoke('templates:save', { name, text, customTerms }),
  load: (name: string) => ipcRenderer.invoke('templates:load', name),
  list: () => ipcRenderer.invoke('templates:list'),
  delete: (name: string) => ipcRenderer.invoke('templates:delete', name),
});

contextBridge.exposeInMainWorld('settings', {
  save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  load: () => ipcRenderer.invoke('settings:load'),
});

// Menu event listeners
ipcRenderer.on('menu:save-template', () => {
  window.dispatchEvent(new CustomEvent('menu-save-template'));
});

ipcRenderer.on('menu:load-template', () => {
  window.dispatchEvent(new CustomEvent('menu-load-template'));
});

ipcRenderer.on('menu:clear-all', () => {
  window.dispatchEvent(new CustomEvent('menu-clear-all'));
});
