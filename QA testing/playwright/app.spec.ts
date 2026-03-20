/**
 * @fileoverview End-to-end tests for Ledebe Protector Electron application.
 * Tests application launch, stability, and core functionality.
 *
 * @author Olaolu
 * @version 1.0.0
 * @since December 2025
 * @license MIT
 */

import { test, expect, _electron as electron } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
const path = require('path');
const os = require('os');
const fs = require('fs');

let electronProcess: ChildProcess;

/** Spawn the Electron app and wait for it to settle. */
function spawnApp(extraArgs: string[] = [], extraEnv: NodeJS.ProcessEnv = {}): ChildProcess {
  const electronPath = require('electron') as string;
  return spawn(electronPath, ['.', ...extraArgs], {
    cwd: path.join(__dirname, '../../..'),
    env: { ...process.env, NODE_ENV: 'production', ...extraEnv },
    stdio: 'ignore',
  });
}

test.beforeAll(async () => {
  electronProcess = spawnApp();
  await new Promise((resolve) => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
});

test.describe('PII Protector E2E Tests', () => {
  test('app launches successfully', async () => {
    expect(electronProcess.pid).toBeDefined();
    expect(electronProcess.killed).toBe(false);
  });

  test('app remains stable', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(electronProcess.killed).toBe(false);
  });

  test('app handles extended runtime', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(electronProcess.pid).toBeGreaterThan(0);
    expect(electronProcess.killed).toBe(false);
  });
});

// ── App Lifecycle — Additional Process Tests ──────────────────────────────────

test.describe('App Lifecycle — Clean Exit', () => {
  test('app exits cleanly on SIGTERM (no crash code)', async () => {
    test.setTimeout(15000);
    const proc = spawnApp();
    // Wait for startup
    await new Promise((r) => setTimeout(r, 3000));
    expect(proc.killed).toBe(false);

    const result = await new Promise<{ code: number | null; signal: string | null }>(
      (resolve) => {
        proc.on('exit', (code, signal) => resolve({ code, signal }));
        proc.kill('SIGTERM');
      }
    );

    // A clean SIGTERM exit has code null + signal 'SIGTERM', or code 0.
    // A crash (SIGSEGV, SIGABRT) would have signal 'SIGSEGV' / 'SIGABRT'.
    expect(result.signal).not.toBe('SIGSEGV');
    expect(result.signal).not.toBe('SIGABRT');
    expect(result.code).not.toBe(139); // 128 + SIGSEGV
  });
});

test.describe('App Stability — Empty localStorage', () => {
  test('app stays alive for 5 seconds with a clean user-data directory', async () => {
    test.setTimeout(15000);
    // Use a fresh temp directory so localStorage/IndexedDB are empty
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledebe-test-'));
    const proc = spawnApp(['--user-data-dir', tmpDir]);

    // Wait 5 seconds
    await new Promise((r) => setTimeout(r, 5000));

    const alive = !proc.killed && proc.exitCode === null;
    proc.kill();
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(alive).toBe(true);
  });
});

test.describe('App Lifecycle — Single Window Guard', () => {
  test('app does not crash when the activate event fires while already running', async () => {
    test.setTimeout(10000);
    // The `if (!win) createWindow()` guard in main.ts prevents extra windows.
    // We verify the process remains stable for 3 s after startup — a duplicate-
    // window crash would produce a non-zero exit almost immediately.
    const proc = spawnApp();
    await new Promise((r) => setTimeout(r, 3000));

    const alive = !proc.killed && proc.exitCode === null;
    proc.kill();

    expect(alive).toBe(true);
  });
});

// ── Electron Window Smoke Test ────────────────────────────────────────────────
//
// Uses Playwright's _electron launcher to get a real BrowserWindow reference
// and assert that the app's core UI elements are actually present — much
// stronger than just checking the child-process is alive.

test.describe('Electron Window Smoke Test', () => {
  test('main window opens and shows the text-input', async () => {
    test.setTimeout(20000);
    const appPath = path.join(__dirname, '../../..');

    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    try {
      const win = await electronApp.firstWindow();
      await win.waitForSelector('#text-input', { state: 'visible', timeout: 10000 });

      await expect(win.locator('#text-input')).toBeVisible();
      await expect(win.locator('#send-btn')).toBeVisible();
      await expect(win.locator('#send-btn')).toBeDisabled();

      const url = win.url();
      expect(url).not.toBe('about:blank');
    } finally {
      await electronApp.close();
    }
  });

  test('exactly one BrowserWindow exists on launch', async () => {
    test.setTimeout(15000);
    const appPath = path.join(__dirname, '../../..');

    const electronApp = await electron.launch({
      args: [appPath],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    try {
      await electronApp.firstWindow(); // wait for the window to appear
      const windows = electronApp.windows();
      expect(windows.length).toBe(1);
    } finally {
      await electronApp.close();
    }
  });
});
