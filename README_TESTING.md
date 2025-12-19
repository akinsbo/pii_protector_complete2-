# End-to-End Testing Setup

## Overview

E2E testing configured with Playwright for Electron apps.

## Installation

Dependencies already installed:

- `@playwright/test`
- `playwright`
- `electron-playwright-helpers`

## Running Tests

```bash
# Run E2E tests (headless mode - default)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see Electron window)
npm run test:e2e:headed
```

## Test Coverage

The E2E test suite (`e2e/app.spec.ts`) covers:

1. **App Launch** - Verifies Electron app starts successfully
2. **App Stability** - Confirms app runs without crashes (2s test)
3. **Extended Runtime** - Validates app handles longer operations (3s test)

For detailed feature testing, see `TEST_COVERAGE.md` which includes:

- PII masking (emails, phones, IPs, cards)
- Custom terms protection
- Text restoration
- UI features (toggles, dark mode, copy buttons)
- Feedback form
- Integration scenarios

## Test Structure

```
e2e/
└── app.spec.ts          # Main test suite
playwright.config.ts      # Playwright configuration
```

## Configuration

Tests run with:

- Single worker (no parallelization for Electron)
- HTML and list reporters
- Screenshots on failure
- Trace on first retry

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
```

## Troubleshooting

If tests fail:

1. Ensure `npm run build` completes successfully
2. Check that `dist/main.js` exists
3. Verify Electron is installed: `npx electron --version`
4. Increase timeout in `playwright.config.ts` if app takes longer to start

## Reports

Test reports are generated in:

- `playwright-report/` - HTML report
- `test-results/` - Test artifacts and screenshots
