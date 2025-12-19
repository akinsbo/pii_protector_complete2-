// main.ts
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Anonymizer } = require('./src/pii/Anonymizer');

let win: any = null;
const anonymizer = new Anonymizer({ consistentMapKey: 'default-session' });

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the HTML file - check if we're in development or packaged
  const isDev = process.env.NODE_ENV === 'development';
  const isPackaged = app.isPackaged;

  if (isDev && !isPackaged) {
    win.loadURL('https://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'index.html'));
  }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  anonymizer.clear();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle(
  'pii:mask',
  (
    _evt: any,
    payload: { text: string; customTerms?: string[]; sessionId?: string }
  ) => {
    if (payload?.customTerms) anonymizer.setCustomTerms(payload.customTerms);
    return anonymizer.mask(payload.text);
  }
);
ipcMain.handle('pii:unmask', (_evt: any, payload: { text: string }) =>
  anonymizer.unmask(payload.text)
);
ipcMain.handle('pii:clear', () => {
  anonymizer.clear();
  return { ok: true };
});

ipcMain.handle(
  'feedback:send',
  async (_evt: any, payload: { message: string; email?: string }) => {
    try {
      const response = await fetch('https://formspree.io/f/xdkogqpv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload.message,
          email: payload.email || 'anonymous',
          app: 'PII Protector',
          timestamp: new Date().toISOString(),
        }),
      });
      return { success: response.ok };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);
