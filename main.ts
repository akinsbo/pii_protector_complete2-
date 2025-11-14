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
  const devURL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(devURL);
  } else {
    win.loadFile(path.resolve(process.cwd(), 'index.dev.html'));
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
