# Ledebe Protector

Professional PII protection application with comprehensive crash reporting and management portal.

## 🧪 Testing

### Quick Test (Recommended for Development)
```bash
./quick-test.sh
```

### Full Test Suite
```bash
./run-tests.sh
```

### Individual Test Suites
```bash
# Cypress Tests
npm run cypress:open          # Interactive mode
npm run cypress:run           # Headless mode
npm run test:cypress          # With dev server

# Playwright Tests (existing)
npm run test:e2e              # All e2e tests
npm run test:e2e:ui           # With UI
npm run test:core             # Core functionality only

# Specific Cypress Test Files
npm run cypress:run -- --spec "QA testing/cypress/e2e/app-functionality.cy.ts"
npm run cypress:run -- --spec "QA testing/cypress/e2e/file-upload.cy.ts"
npm run cypress:run -- --spec "QA testing/cypress/e2e/ui-accessibility.cy.ts"
npm run cypress:run -- --spec "QA testing/cypress/e2e/advanced-features.cy.ts"
```

### Test Coverage

**Core Functionality Tests:**
- ✅ Application loading and initialization
- ✅ Text input and protection workflow
- ✅ PII detection (emails, phones, custom terms)
- ✅ Message views (plain/protected text switching)
- ✅ Message actions (copy, edit, delete)
- ✅ History management (save, load, rename, delete)
- ✅ Custom terms management
- ✅ Dark mode toggle and persistence
- ✅ Keyboard shortcuts
- ✅ Sidebar functionality

**File Upload Tests:**
- ✅ Text file processing
- ✅ Image upload with OCR simulation
- ✅ PDF processing workflow
- ✅ Document preview modal
- ✅ Protected document download
- ✅ File removal and error handling
- ✅ Large file processing
- ✅ Multiple file format support

**UI/Accessibility Tests:**
- ✅ Responsive design across viewports
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast (light/dark modes)
- ✅ ARIA labels and semantic HTML
- ✅ Performance under load
- ✅ Error state handling
- ✅ Browser compatibility

**Advanced Features Tests:**
- ✅ Complex PII pattern detection
- ✅ International phone number formats
- ✅ Mixed content (code + text) processing
- ✅ Data persistence across sessions
- ✅ Security features (PII exposure prevention)
- ✅ Performance with large documents
- ✅ Workflow integration testing

### Test Data
Test fixtures are located in `QA testing/cypress/fixtures/testData.json` and include:
- Sample texts with various PII types
- Custom terms for testing
- Protected pattern examples
- Edge cases and complex scenarios

### Continuous Integration
The test suite is designed to run in CI environments:
```bash
# For CI/CD pipelines
npm run build && npm run cypress:run
```

## 🚀 Quick Start

### Build Installers
```bash
npm install
npm run dist:mac     # macOS DMG
npm run dist:win     # Windows installer
npm run dist:all     # All platforms
```

### Management Portal
```bash
cd management-portal
./deploy-portal.sh
```

Access at: http://ledebe.s3-website-us-east-1.amazonaws.com/management/

## 📚 Documentation

**Complete Setup Guide**: [`docs/MANAGEMENT_SETUP.md`](docs/MANAGEMENT_SETUP.md)

This guide covers:
- Professional installation experience (macOS DMG, Windows NSIS)
- Unified management portal with crash reporting
- Environment setup and configuration
- Code signing and deployment
- Troubleshooting and support

## 🛡️ Features

- **Professional Installers**: Custom DMG for macOS, NSIS installer for Windows
- **Crash Reporting**: Automatic crash detection with detailed analysis
- **Management Portal**: Real-time monitoring, analytics, and crash management
- **Multi-platform**: Universal binaries for macOS, Windows support
- **Code Signing Ready**: Notarization and certificate support
- **AI Integration**: Chat with OpenAI, Anthropic, or Google AI using protected data
  - 🤖 Quick Setup: See [`AI_QUICK_SETUP.md`](AI_QUICK_SETUP.md)
  - 🔧 Troubleshooting: See [`AI_TROUBLESHOOTING_GUIDE.md`](AI_TROUBLESHOOTING_GUIDE.md)

## 🚨 Crash Reporting

Set up instant notifications:
```bash
export CRASH_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Crashes are automatically:
- Stored locally in `~/.ledebe-crashes/`
- Reported to management portal
- Sent via Slack webhook
- Backed up to email (Formspree)

## 📊 Management Portal

Access the unified portal for:
- **Overview**: App metrics, crash statistics, platform distribution
- **Crashes**: Real-time crash monitoring and detailed analysis  
- **Analytics**: Usage trends, success rates, user engagement

## 🔧 Development

```bash
npm run dev          # Development server
npm run build        # Build TypeScript
npm run test:e2e     # End-to-end tests (Playwright)
npm run cypress:run  # End-to-end tests (Cypress)
npm run lint         # Code linting
./quick-test.sh      # Quick test suite
./run-tests.sh       # Full test suite
```

---

**Version**: 1.0.0  
**License**: MIT  
**Author**: Ledebe