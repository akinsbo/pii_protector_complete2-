# GitHub Actions Pipeline Setup Guide

## Current Configuration
Your `.github/workflows/ci.yml` already has PR triggers:
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]  # ← Already configured!
```

## Setup Steps

### 1. Push workflows to GitHub:
```bash
git add .github/workflows/
git commit -m "Add CI/CD pipeline"
git push origin main
```

### 2. Enable GitHub Actions:
- Go to your GitHub repository
- Click **Actions** tab
- Click **"I understand my workflows, go ahead and enable them"**

### 3. Add secrets (optional):
- Go to **Settings** → **Secrets and variables** → **Actions**
- Add `SNYK_TOKEN` for enhanced security scanning

## Test the Pipeline

Create a test PR:
```bash
git checkout -b test-pipeline
git commit --allow-empty -m "Test pipeline"
git push origin test-pipeline
```

Then create a PR from `test-pipeline` → `main` on GitHub.

## Pipeline Triggers

Pipeline will run on:
- ✅ PR creation to `main`/`develop`
- ✅ PR updates (new commits)
- ✅ Direct pushes to `main`/`develop`

## Pipeline Jobs

1. **Test** - E2E tests on macOS
2. **Security** - npm audit + Snyk scan
3. **Code Quality** - ESLint + TypeScript
4. **Build** - Package .dmg (only after other jobs pass)

## Local Testing

Run pipeline checks locally:
```bash
npm run test:all          # Complete pipeline
npm run lint              # Code quality
npm run security:audit    # Security check
npm run test:e2e          # E2E tests
npm run build             # TypeScript build
```

## Artifacts

After pipeline runs, download from GitHub Actions:
- **playwright-report** - Test results (30 days)
- **macos-build** - .dmg files (7 days)
- **npm-audit-report** - Security scan results

The pipeline is ready to use!