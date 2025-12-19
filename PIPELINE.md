# CI/CD Pipeline Documentation

## Overview

Automated pipeline with E2E testing, security scanning, and code quality checks.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on: Push to main/develop, Pull Requests

**Jobs:**

- **Test** (macOS)
  - TypeScript compilation
  - E2E tests with Playwright
  - Upload test reports
- **Security** (Ubuntu)
  - npm audit (dependency vulnerabilities)
  - Snyk security scan
- **Code Quality** (Ubuntu)
  - TypeScript strict check
  - ESLint code linting
- **Build** (macOS)
  - Package macOS .dmg
  - Upload build artifacts

### 2. Security Scan (`.github/workflows/security.yml`)

Runs on: Weekly schedule (Sunday), Manual trigger

**Jobs:**

- Dependency vulnerability scan
- CodeQL static analysis
- Generate security reports

### 3. Test Coverage (`.github/workflows/coverage.yml`)

Runs on: Push to main, Pull Requests

**Jobs:**

- Run E2E tests
- Generate coverage reports
- Comment on PRs with results

## Local Commands

```bash
# Run all checks
npm run test:all

# Individual checks
npm run lint              # ESLint
npm run lint:fix          # Auto-fix lint issues
npm run format            # Format code with Prettier
npm run format:check      # Check formatting
npm run security:audit    # npm audit
npm run test:e2e          # E2E tests

# Build
npm run build             # TypeScript compilation
npm run dist:mac          # Package macOS app
```

## Required Secrets

Add these to GitHub repository secrets:

- `SNYK_TOKEN` - Snyk API token (optional, for enhanced security scanning)

## Pipeline Status

All workflows must pass before merging to main:

- ✅ E2E tests pass
- ✅ No high/critical security vulnerabilities
- ✅ Code passes linting
- ✅ TypeScript compiles without errors
- ✅ Build succeeds

## Artifacts

Generated artifacts (available for 7-30 days):

- `playwright-report` - E2E test results
- `macos-build` - Packaged .dmg file
- `npm-audit-report` - Security scan results

## Monitoring

- View workflow runs: Actions tab in GitHub
- Download reports: Artifacts section in workflow runs
- Security alerts: Security tab in GitHub
