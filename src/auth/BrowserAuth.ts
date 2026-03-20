/**
 * @fileoverview Browser-based authentication for chat services
 * Similar to Zoom's approach - authenticate in browser, use in app
 */

import { BrowserWindow, shell } from 'electron';
import * as path from 'path';

export interface AuthProvider {
  name: string;
  displayName: string;
  authUrl: string;
  redirectUrl: string;
  scopes?: string[];
  clientId?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  userInfo?: any;
  error?: string;
}

export class BrowserAuth {
  private authWindow: BrowserWindow | null = null;
  private providers: Map<string, AuthProvider> = new Map();

  constructor() {
    this.setupProviders();
  }

  private setupProviders() {
    // ChatGPT/OpenAI
    this.providers.set('openai', {
      name: 'openai',
      displayName: 'ChatGPT',
      authUrl: 'https://chat.openai.com/auth/login',
      redirectUrl: 'https://chat.openai.com/'
    });

    // Google Gemini
    this.providers.set('gemini', {
      name: 'gemini',
      displayName: 'Google Gemini',
      authUrl: 'https://accounts.google.com/signin',
      redirectUrl: 'https://gemini.google.com/'
    });

    // Claude
    this.providers.set('claude', {
      name: 'claude',
      displayName: 'Claude',
      authUrl: 'https://claude.ai/login',
      redirectUrl: 'https://claude.ai/'
    });

    // Microsoft Copilot
    this.providers.set('copilot', {
      name: 'copilot',
      displayName: 'Microsoft Copilot',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      redirectUrl: 'https://copilot.microsoft.com/'
    });
  }

  /**
   * Authenticate with a chat service using browser
   */
  async authenticateWithBrowser(providerName: string): Promise<AuthResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    return new Promise((resolve) => {
      // Open authentication in default browser
      shell.openExternal(provider.authUrl);

      // Create a return-to-app window (loads local data: HTML only)
      this.authWindow = new BrowserWindow({
        width: 450,
        height: 350,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          preload: path.join(__dirname, '../../preload.js'),
          allowRunningInsecureContent: false,
          experimentalFeatures: false,
          navigateOnDragDrop: false
        },
        title: `Sign in to ${provider.displayName}`,
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true
      });

      this.authWindow.loadURL(`data:text/html,${this.getReturnToAppHTML(provider)}`);

      // Handle window close
      this.authWindow.on('closed', () => {
        this.authWindow = null;
        resolve({ success: false, error: 'Authentication cancelled' });
      });

      // Handle return button click
      this.authWindow.webContents.on('did-finish-load', () => {
        this.authWindow?.webContents.executeJavaScript(`
          document.getElementById('return-btn').addEventListener('click', () => {
            window.electronAPI?.returnToApp?.();
          });
        `);
      });

      // Listen for return-to-app via app event emitter
      const { app } = require('electron');
      const returnHandler = async () => {
        const isAuth = await this.testServiceAccess(provider);
        if (isAuth) {
          if (this.authWindow) {
            this.authWindow.close();
          }
          resolve({
            success: true,
            token: 'browser-session',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });
        } else {
          // Show error in the window
          this.authWindow?.webContents.executeJavaScript(`
            document.getElementById('status').innerHTML = '<div style="color: #e74c3c; margin-top: 1rem;">Not signed in yet. Please complete sign-in in your browser first.</div>';
          `);
        }
      };

      app.once('auth:return-to-app-internal', returnHandler);
    });
  }

  /**
   * Test if service is accessible (user is signed in)
   */
  private async testServiceAccess(provider: AuthProvider): Promise<boolean> {
    const testWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      }
    });

    try {
      await testWindow.loadURL(provider.redirectUrl);

      // Check if we're on the main service page (not login page)
      const url = testWindow.webContents.getURL();
      const title = testWindow.webContents.getTitle();

      // Simple heuristics to detect successful login
      return !url.includes('login') &&
             !url.includes('signin') &&
             !url.includes('auth') &&
             !title.toLowerCase().includes('sign in');

    } catch (error) {
      return false;
    } finally {
      if (!testWindow.isDestroyed()) {
        testWindow.destroy();
      }
    }
  }

  /**
   * Open chat service in app's embedded browser
   */
  async openServiceInApp(providerName: string): Promise<BrowserWindow | null> {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    const chatWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        partition: `persist:${providerName}` // Separate session for each service
      },
      title: `${provider.displayName} - Ledebe Protector`
    });

    // Restrict navigation to the provider's own domain
    const allowedHost = new URL(provider.redirectUrl).hostname;
    chatWindow.webContents.on('will-navigate', (event, url) => {
      try {
        const host = new URL(url).hostname;
        if (!host.endsWith(allowedHost) && host !== allowedHost) {
          event.preventDefault();
        }
      } catch {
        event.preventDefault();
      }
    });

    await chatWindow.loadURL(provider.redirectUrl);
    return chatWindow;
  }

  /**
   * Get return-to-app instruction HTML
   */
  private getReturnToAppHTML(provider: AuthProvider): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sign in to ${provider.displayName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 350px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h2 {
            color: #333;
            margin-bottom: 15px;
          }
          p {
            color: #666;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .return-btn {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
          }
          .return-btn:hover {
            background: #0056CC;
            transform: translateY(-1px);
          }
          .browser-hint {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🌐</div>
          <h2>Sign in to ${provider.displayName}</h2>
          <p>A browser tab has opened for you to sign in.</p>
          
          <div class="browser-hint">
            <strong>💡 Tip:</strong> If you're already signed in to ${provider.displayName} in your browser, this should be quick!
          </div>
          
          <p><strong>After signing in:</strong><br>
          Click the button below to return to Ledebe and start using ${provider.displayName}.</p>
          
          <button id="return-btn" class="return-btn">
            ✅ I'm signed in - Return to Ledebe
          </button>
          
          <div id="status"></div>
        </div>
        
        <script>
          // Expose return function to main process
          if (window.electronAPI) {
            window.electronAPI.returnToApp = () => {
              window.electronAPI.invoke('auth:return-to-app');
            };
          }
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Get all available providers
   */
  getProviders(): AuthProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if user is authenticated with a service
   */
  async isAuthenticated(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;
    
    return await this.testServiceAccess(provider);
  }
}