// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { Anonymizer } from './src/pii/Anonymizer';

let win: BrowserWindow | null = null;
const anonymizer = new Anonymizer({ consistentMapKey: 'default-session' });

function createWindow() {
  win = new BrowserWindow({
    width: 1100, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  
  // Load the HTML file - check if we're in development or packaged
  const isDev = process.env.NODE_ENV === 'development';
  const isPackaged = app.isPackaged;
  
  if (isDev && !isPackaged) {
    // Development mode - load from project root
    win.loadFile(path.join(process.cwd(), 'index.dev.html'));
  } else {
    // Production/packaged mode - load from app directory
    win.loadFile(path.join(__dirname, '..', 'index.dev.html'));
  }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { anonymizer.clear(); if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('pii:mask', (_evt, payload: { text: string; customTerms?: string[]; sessionId?: string }) => {
  if (payload?.customTerms) anonymizer.setCustomTerms(payload.customTerms);
  return anonymizer.mask(payload.text);
});
ipcMain.handle('pii:unmask', (_evt, payload: { text: string }) => anonymizer.unmask(payload.text));
ipcMain.handle('pii:clear', () => { anonymizer.clear(); return { ok: true }; });
