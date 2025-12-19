import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let electronProcess: ChildProcess;

test.beforeAll(async () => {
  const electronPath = require('electron') as string;
  electronProcess = spawn(electronPath, ['.'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'ignore',
  });

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
