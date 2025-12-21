/**
 * @fileoverview Advanced crash reporting system for Ledebe Protector.
 * Handles crash collection, analysis, and reporting to management portal.
 */

import { app, WebContents } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface CrashReport {
  id: string;
  timestamp: string;
  type: 'uncaughtException' | 'unhandledRejection' | 'rendererCrash' | 'gpuCrash';
  message: string;
  stack?: string;
  platform: string;
  arch: string;
  version: string;
  userId: string;
  sessionId: string;
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    cpus: number;
    uptime: number;
    nodeVersion: string;
    electronVersion: string;
    osVersion: string;
    osRelease: string;
    cpuModel: string;
    cpuSpeed: number;
    loadAverage: number[];
    networkInterfaces: string[];
    screenResolution: string;
    locale: string;
    timezone: string;
    diskSpace: {
      total: number;
      free: number;
      used: number;
    };
    gpuInfo: string;
    installedRAM: string;
    architecture: string;
  };
  breadcrumbs: Breadcrumb[];
  metadata?: Record<string, any>;
}

export interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class CrashReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private userId: string;
  private crashDir: string;
  private maxBreadcrumbs = 50;
  private reportingEndpoint = 'https://api.github.com/gists';
  private githubToken = process.env.GITHUB_TOKEN || '';
  private gistId = process.env.CRASH_GIST_ID || '';
  private webhookUrl = process.env.CRASH_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

  constructor() {
    this.sessionId = this.generateId();
    this.userId = this.getUserId();
    this.crashDir = path.join(os.homedir(), '.ledebe-crashes');
    this.ensureCrashDir();
    this.setupCrashHandlers();
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getUserId(): string {
    const userIdPath = path.join(os.homedir(), '.ledebe-user-id');
    try {
      if (fs.existsSync(userIdPath)) {
        return fs.readFileSync(userIdPath, 'utf8').trim();
      }
    } catch (error) {
      console.error('Error reading user ID:', error);
    }
    
    const newUserId = this.generateId();
    try {
      fs.writeFileSync(userIdPath, newUserId);
    } catch (error) {
      console.error('Error saving user ID:', error);
    }
    
    return newUserId;
  }

  private ensureCrashDir(): void {
    try {
      if (!fs.existsSync(this.crashDir)) {
        fs.mkdirSync(this.crashDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create crash directory:', error);
    }
  }

  private setupCrashHandlers(): void {
    // Main process crashes
    process.on('uncaughtException', (error) => {
      this.reportCrash('uncaughtException', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.reportCrash('unhandledRejection', reason as Error, {
        promise: promise.toString()
      });
    });
  }

  addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data
    };

    this.breadcrumbs.push(breadcrumb);
    
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  private async reportCrash(type: CrashReport['type'], error: Error, metadata?: Record<string, any>): Promise<void> {
    const crashReport: CrashReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack,
      platform: os.platform(),
      arch: os.arch(),
      version: app.getVersion(),
      userId: this.userId,
      sessionId: this.sessionId,
      systemInfo: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime(),
        nodeVersion: process.version,
        electronVersion: process.versions.electron || 'unknown',
        osVersion: os.version(),
        osRelease: os.release(),
        cpuModel: os.cpus()[0]?.model || 'unknown',
        cpuSpeed: os.cpus()[0]?.speed || 0,
        loadAverage: os.loadavg(),
        networkInterfaces: Object.keys(os.networkInterfaces()),
        screenResolution: this.getScreenResolution(),
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        diskSpace: await this.getDiskSpace(),
        gpuInfo: this.getGPUInfo(),
        installedRAM: this.formatBytes(os.totalmem()),
        architecture: os.arch()
      },
      breadcrumbs: [...this.breadcrumbs],
      metadata
    };

    // Save crash report locally
    await this.saveCrashReport(crashReport);

    // Send to remote endpoint
    await this.sendCrashReport(crashReport);

    // Send immediate notification
    await this.sendCrashNotification(crashReport);

    console.error(`Crash reported: ${crashReport.id}`, error);
  }

  private async saveCrashReport(report: CrashReport): Promise<void> {
    try {
      const filename = `crash-${report.id}-${Date.now()}.json`;
      const filepath = path.join(this.crashDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save crash report locally:', error);
    }
  }

  private async sendCrashReport(report: CrashReport): Promise<void> {
    try {
      // Try GitHub Gist first (free tier)
      if (this.githubToken && this.gistId) {
        await this.sendToGist(report);
      } else {
        // Fallback to formspree
        await this.sendToFormspree(report);
      }
    } catch (error) {
      console.error('Failed to send crash report:', error);
      // Always fallback to formspree
      await this.sendToFormspree(report);
    }
  }

  private async sendToGist(report: CrashReport): Promise<void> {
    try {
      const filename = `crash-${report.id}.json`;
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': `Ledebe-Protector/${app.getVersion()}`
        },
        body: JSON.stringify({
          files: {
            [filename]: {
              content: JSON.stringify(report, null, 2)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send crash to GitHub Gist:', error);
      throw error;
    }
  }

  private async sendToFormspree(report: CrashReport): Promise<void> {
    try {
      await fetch('https://formspree.io/f/xdkogqpv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `🚨 Ledebe Crash Report - ${report.type}`,
          crash_id: report.id,
          crash_type: report.type,
          message: report.message,
          platform: report.platform,
          version: report.version,
          timestamp: report.timestamp,
          user_id: report.userId,
          full_report: JSON.stringify(report, null, 2)
        })
      });
    } catch (error) {
      console.error('Failed to send crash report to formspree:', error);
    }
  }

  private async sendCrashNotification(report: CrashReport): Promise<void> {
    if (!this.webhookUrl || this.webhookUrl.includes('YOUR/WEBHOOK/URL')) {
      return;
    }

    const notification = {
      text: `🚨 Crash Alert: Ledebe Protector`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Crash Type',
              value: report.type,
              short: true
            },
            {
              title: 'Platform',
              value: `${report.platform} ${report.arch}`,
              short: true
            },
            {
              title: 'Version',
              value: report.version,
              short: true
            },
            {
              title: 'Time',
              value: report.timestamp,
              short: true
            },
            {
              title: 'Message',
              value: report.message,
              short: false
            },
            {
              title: 'Crash ID',
              value: report.id,
              short: false
            }
          ]
        }
      ]
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Failed to send crash notification:', error);
    }
  }

  async getStoredCrashes(): Promise<CrashReport[]> {
    try {
      const files = fs.readdirSync(this.crashDir);
      const crashes: CrashReport[] = [];

      for (const file of files) {
        if (file.startsWith('crash-') && file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(this.crashDir, file), 'utf8');
            crashes.push(JSON.parse(content));
          } catch (error) {
            console.error(`Failed to read crash file ${file}:`, error);
          }
        }
      }

      return crashes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get stored crashes:', error);
      return [];
    }
  }

  async clearOldCrashes(daysOld: number = 30): Promise<void> {
    try {
      const files = fs.readdirSync(this.crashDir);
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('crash-') && file.endsWith('.json')) {
          const filepath = path.join(this.crashDir, file);
          const stats = fs.statSync(filepath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filepath);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear old crashes:', error);
    }
  }

  private getScreenResolution(): string {
    try {
      const { screen } = require('electron');
      const display = screen.getPrimaryDisplay();
      return `${display.bounds.width}x${display.bounds.height}`;
    } catch (error) {
      return 'unknown';
    }
  }

  private async getDiskSpace(): Promise<{ total: number; free: number; used: number }> {
    try {
      const { execSync } = require('child_process');
      let command: string;
      
      if (os.platform() === 'win32') {
        command = 'wmic logicaldisk get size,freespace,caption';
      } else {
        command = 'df -h /';
      }
      
      const output = execSync(command, { encoding: 'utf8' });
      // Parse output and return disk space info
      // This is a simplified version - in production, use a proper disk space library
      return { total: 0, free: 0, used: 0 };
    } catch (error) {
      return { total: 0, free: 0, used: 0 };
    }
  }

  private getGPUInfo(): string {
    try {
      const { app } = require('electron');
      const gpuInfo = app.getGPUFeatureStatus();
      return JSON.stringify(gpuInfo);
    } catch (error) {
      return 'unknown';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const crashReporter = new CrashReporter();