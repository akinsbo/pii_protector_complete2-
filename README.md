# Ledebe Protector

Professional PII protection application with comprehensive crash reporting and management portal.

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
npm run test:e2e     # End-to-end tests
npm run lint         # Code linting
```

---

**Version**: 1.0.0  
**License**: MIT  
**Author**: Ledebe