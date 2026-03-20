/**
 * @fileoverview Main Electron process for Ledebe Protector application.
 * Handles window creation, IPC communication, and PII protection services.
 * 
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

const { app, BrowserWindow, ipcMain, Menu, safeStorage } = require('electron');
const path = require('path');
const os = require('os');
const { crashReporter } = require('./src/crash-reporter');
const { BrowserAuth } = require('./src/auth/BrowserAuth');

let win: any = null;
const browserAuth = new BrowserAuth();

/**
 * Creates the application menu with templates functionality.
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Template',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu:save-template')
        },
        {
          label: 'Load Template',
          accelerator: 'CmdOrCtrl+O',
          click: () => win.webContents.send('menu:load-template')
        },
        { type: 'separator' },
        {
          label: 'Clear All',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => win.webContents.send('menu:clear-all')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  crashReporter.addBreadcrumb('window', 'Creating main window', 'info');
  
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    icon: path.join(__dirname, 'assets', 'ledebe-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
  });

  createMenu();

  // Load the HTML file - check if we're in development or packaged
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    crashReporter.addBreadcrumb('window', 'Loading development URL', 'info');
    win.loadURL('http://localhost:5173');
  } else {
    crashReporter.addBreadcrumb('window', 'Loading production HTML', 'info');
    win.loadFile('index.html');
  }
  
  crashReporter.addBreadcrumb('window', 'Main window created successfully', 'info');
}
app.whenReady().then(() => {
  crashReporter.addBreadcrumb('app', 'Application started', 'info');
  
  // SSL bypass — development only. Never disable SSL validation in production.
  if (process.env.NODE_ENV === 'development') {
    app.commandLine.appendSwitch('ignore-certificate-errors-spki-list');
    app.commandLine.appendSwitch('ignore-ssl-errors');
  }
  
  createWindow();
  sendInstallationEvent();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!win) createWindow();
});

ipcMain.handle(
  'feedback:send',
  async (_evt: any, payload: { message: string; email?: string }) => {
    try {
      const feedbackData = {
        id: generateUUID(),
        message: payload.message,
        email: payload.email || 'anonymous',
        app: 'PII Protector',
        timestamp: new Date().toISOString(),
        version: app.getVersion(),
        platform: os.platform()
      };
      
      // Try to store in GitHub Gist first
      const githubToken = process.env.GITHUB_TOKEN;
      const gistId = process.env.CRASH_GIST_ID;
      
      if (githubToken && gistId) {
        try {
          const filename = `feedback-${feedbackData.id}.json`;
          const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Content-Type': 'application/json',
              'User-Agent': `Ledebe-Protector/${app.getVersion()}`
            },
            body: JSON.stringify({
              files: {
                [filename]: {
                  content: JSON.stringify(feedbackData, null, 2)
                }
              }
            })
          });
          
          if (response.ok) {
            crashReporter.addBreadcrumb('feedback', 'Feedback sent successfully', 'info');
            return { success: true };
          }
        } catch (gistError) {
          console.error('Failed to store feedback in GitHub Gist:', gistError);
        }
      }
      
      // Fallback to Formspree
      const response = await fetch('https://formspree.io/f/xdkogqpv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Ledebe Feedback',
          ...feedbackData
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

// Template storage handlers
ipcMain.handle('templates:save', (_evt: any, payload: { name: string; text: string; customTerms: string[] }) => {
  try {
    const templates = getTemplates();
    templates[payload.name] = {
      text: payload.text,
      customTerms: payload.customTerms,
      createdAt: new Date().toISOString()
    };
    saveTemplates(templates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('templates:load', (_evt: any, name: string) => {
  try {
    const templates = getTemplates();
    return { success: true, template: templates[name] || null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('templates:list', () => {
  try {
    const templates = getTemplates();
    return { success: true, templates: Object.keys(templates) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('templates:delete', (_evt: any, name: string) => {
  try {
    const templates = getTemplates();
    delete templates[name];
    saveTemplates(templates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Settings handlers
ipcMain.handle('settings:save', (_evt: any, settings: any) => {
  try {
    saveSettings(settings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('settings:load', () => {
  try {
    const settings = getSettings();
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Browser authentication handlers
ipcMain.handle('auth:authenticate', async (_evt: any, providerName: string) => {
  try {
    const result = await browserAuth.authenticateWithBrowser(providerName);
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('auth:openInApp', async (_evt: any, providerName: string) => {
  try {
    const chatWindow = await browserAuth.openServiceInApp(providerName);
    return { success: !!chatWindow };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('auth:getProviders', () => {
  try {
    const providers = browserAuth.getProviders();
    return { success: true, providers };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('auth:isAuthenticated', async (_evt: any, providerName: string) => {
  try {
    const isAuth = await browserAuth.isAuthenticated(providerName);
    return { success: true, authenticated: isAuth };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Handle return to app from browser auth
ipcMain.handle('auth:return-to-app', () => {
  app.emit('auth:return-to-app-internal');
  return { success: true };
});

// Secure key storage using OS keychain via safeStorage
ipcMain.handle('safeStorage:encrypt', (_evt: any, plaintext: string): string => {
  if (!plaintext || !safeStorage.isEncryptionAvailable()) return plaintext;
  return safeStorage.encryptString(plaintext).toString('base64');
});

ipcMain.handle('safeStorage:decrypt', (_evt: any, value: string): string => {
  if (!value || !safeStorage.isEncryptionAvailable()) return value;
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return value; // value was stored as plaintext before migration
  }
});

/**
 * Gets stored templates from file system.
 */
function getTemplates() {
  const fs = require('fs');
  const os = require('os');
  const templatesPath = path.join(os.homedir(), '.ledebe-templates.json');
  
  try {
    if (fs.existsSync(templatesPath)) {
      return JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading templates:', error);
  }
  return {};
}

/**
 * Saves templates to file system.
 */
function saveTemplates(templates: any) {
  const fs = require('fs');
  const os = require('os');
  const templatesPath = path.join(os.homedir(), '.ledebe-templates.json');
  
  fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
}

/**
 * Gets stored settings from file system.
 */
function getSettings() {
  const fs = require('fs');
  const os = require('os');
  const settingsPath = path.join(os.homedir(), '.ledebe-settings.json');
  
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  
  // Return default settings
  return {
    customTerms: [],
    autoSave: true,
    theme: 'system',
    notifications: true
  };
}

/**
 * Saves settings to file system.
 */
function saveSettings(settings: any) {
  const fs = require('fs');
  const os = require('os');
  const settingsPath = path.join(os.homedir(), '.ledebe-settings.json');
  
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Compile TypeScript files on the fly for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2020'
      }
    });
  } catch (error) {
    console.warn('ts-node not available, using compiled JS files');
  }
}





/**
 * Sends installation/startup event.
 */
function sendInstallationEvent() {
  const installData = {
    event: 'app_start',
    platform: os.platform(),
    arch: os.arch(),
    version: app.getVersion(),
    timestamp: new Date().toISOString(),
    userId: getUserId(),
    isFirstRun: isFirstRun()
  };

  fetch('https://formspree.io/f/xdkogqpv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Ledebe Analytics - App Start',
      analytics: installData
    })
  }).catch(console.error);
}

/**
 * Gets or creates a unique user ID.
 */
function getUserId(): string {
  const fs = require('fs');
  const userIdPath = path.join(os.homedir(), '.ledebe-user-id');
  
  try {
    if (fs.existsSync(userIdPath)) {
      return fs.readFileSync(userIdPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error reading user ID:', error);
  }
  
  // Generate UUID without external dependency
  const newUserId = generateUUID();
  try {
    fs.writeFileSync(userIdPath, newUserId);
  } catch (error) {
    console.error('Error saving user ID:', error);
  }
  
  return newUserId;
}

/**
 * Generates a simple UUID v4 without external dependencies.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Checks if this is the first run of the application.
 */
function isFirstRun(): boolean {
  const fs = require('fs');
  const firstRunPath = path.join(os.homedir(), '.ledebe-first-run');
  
  if (fs.existsSync(firstRunPath)) {
    return false;
  }
  
  try {
    fs.writeFileSync(firstRunPath, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error marking first run:', error);
    return false;
  }
}
