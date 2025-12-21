# Ledebe Protector - Complete Management & Installation Guide

## 🚀 Professional Installation Experience

### Build Commands
```bash
# macOS DMG (current architecture)
npm run dist:mac

# macOS Universal (Intel + Apple Silicon)  
npm run dist:mac-universal

# Windows NSIS Installer
npm run dist:win

# Windows Portable
npm run dist:win-portable

# All platforms
npm run dist:all
```

### Installation Features

#### macOS (DMG)
- ✅ Custom branded DMG with drag-to-Applications
- ✅ Universal binary support (Intel + Apple Silicon)
- ✅ Code signing ready (when certificates available)
- ✅ Notarization support
- ✅ Professional installer UI

#### Windows (NSIS)
- ✅ Professional installer wizard with license agreement
- ✅ Custom installation directory selection
- ✅ Desktop and Start Menu shortcuts
- ✅ Multi-language support and uninstaller
- ✅ Portable version available

## 🛡️ Unified Management Portal

### Features
- **📊 Overview Dashboard**: App metrics, crash statistics, platform distribution
- **🚨 Crash Reporting**: Real-time crash monitoring and detailed analysis
- **📈 Analytics**: Usage trends, success rates, user engagement

### Access Management Portal
```bash
# Deploy to S3
cd management-portal
./deploy-portal.sh

# Access at:
# http://ledebe.s3-website-us-east-1.amazonaws.com/management/
```

### Portal Sections

#### 1. Overview Dashboard
- Total installs and active users
- Real-time crash statistics
- Platform distribution (macOS/Windows/Linux)
- System health monitoring

#### 2. Crash Reporting
- Automatic crash detection and reporting
- Detailed crash analysis with stack traces
- User impact tracking
- Crash trends and patterns

#### 3. Analytics
- Daily usage statistics
- Session tracking
- Success rate monitoring
- Historical data analysis

## 🚨 Crash Reporting System

### Setup (100% Free)
```bash
# 1. Setup free crash storage using GitHub Gists
./setup-crash-storage.sh

# 2. Set Slack webhook for instant notifications (optional)
export CRASH_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 3. Deploy management portal
cd management-portal
./deploy-portal.sh
```

### Free Tier Components
- **GitHub Gists**: Free private storage for crash reports
- **S3 Static Website**: Free tier hosting for management portal
- **Formspree**: Free email notifications (fallback)
- **Slack Webhooks**: Free instant notifications

### Crash Data Storage
- **Local crashes**: `~/.ledebe-crashes/`
- **User ID**: `~/.ledebe-user-id`
- **Templates**: `~/.ledebe-templates.json`

### Crash Report Contents
Each crash report includes:
- Crash ID and timestamp
- Error message and stack trace
- Platform and architecture information
- App version and user/session IDs
- System information (memory, CPU, uptime)
- User breadcrumbs (last 50 actions)
- Custom metadata

### Notification Channels
1. **Slack** (instant): Set `CRASH_WEBHOOK_URL`
2. **Email** (fallback): Automatically sent to Formspree
3. **Management Portal**: Real-time dashboard updates

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Crash notifications
export CRASH_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Management portal deployment
export MANAGEMENT_PORTAL_HOST="management.ledebe.com"
export MANAGEMENT_PORTAL_PATH="/var/www/management"
export MANAGEMENT_PORTAL_USER="deploy"

# Code signing (optional)
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASS="app-specific-password"
```

## 📦 Build Output

After building, find installers in `dist-build/`:
- **macOS**: `Ledebe Protector-1.0.0-arm64.dmg`
- **Windows**: `Ledebe Protector Setup 1.0.0.exe`
- **Portable**: `Ledebe Protector 1.0.0.exe`

## 🔐 Code Signing (Optional)

### macOS
```bash
# Get Apple Developer certificate
# Set environment variables
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASS="app-specific-password"

# Build with signing
npm run dist:mac
```

### Windows
Add to package.json:
```json
{
  "win": {
    "certificateFile": "path/to/certificate.p12",
    "certificatePassword": "your-password"
  }
}
```

## 🧪 Testing Installation

### macOS Testing
1. Build: `npm run dist:mac`
2. Open `dist-build/Ledebe Protector-1.0.0-arm64.dmg`
3. Drag app to Applications folder
4. Launch from Applications or Spotlight
5. Check crash reporting in `~/.ledebe-crashes/`

### Windows Testing
1. Build on Windows: `npm run dist:win`
2. Run `Ledebe Protector Setup 1.0.0.exe`
3. Follow installer wizard
4. Launch from Desktop or Start Menu
5. Check crash reporting in `%USERPROFILE%\.ledebe-crashes\`

## 📊 Monitoring & Analytics

### Management Portal Features
- **Real-time Statistics**: Live crash counts, user metrics
- **Crash Analysis**: Detailed crash reports with stack traces
- **Platform Insights**: Distribution across macOS/Windows/Linux
- **Trend Analysis**: Historical data and patterns
- **User Impact**: Affected users and session tracking

### API Endpoints
```
GET  /api/crashes     - List all crashes
POST /api/crashes     - Submit new crash report
GET  /api/analytics   - Usage analytics
GET  /api/health      - System health check
```

## 🛠 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf dist-build node_modules
npm install
npm run build
npm run dist:mac
```

### Crash Reporting Issues
```bash
# Check crash directory
ls -la ~/.ledebe-crashes/

# Test crash reporting
node -e "throw new Error('Test crash')"

# Verify webhook
curl -X POST $CRASH_WEBHOOK_URL -d '{"text":"Test notification"}'
```

### Management Portal Issues
```bash
# Deploy portal
cd management-portal
./deploy-portal.sh

# Check deployment
curl -I http://ledebe.s3-website-us-east-1.amazonaws.com/management/
```

## 📞 Support & Documentation

### Key Files
- **Installation Guide**: `docs/MANAGEMENT_SETUP.md` (this file)
- **Crash Reporter**: `src/crash-reporter.ts`
- **Management Portal**: `management-portal/index.html`
- **Build Config**: `package.json` (build section)
- **Deployment**: `management-portal/deploy-portal.sh`

### Quick Links
- **Management Portal**: http://ledebe.s3-website-us-east-1.amazonaws.com/management/
- **Crash Reports**: http://ledebe.s3-website-us-east-1.amazonaws.com/management/#crashes
- **Analytics**: http://ledebe.s3-website-us-east-1.amazonaws.com/management/#analytics

---

**Status**: ✅ Production Ready  
**Last Updated**: December 2025  
**Version**: 1.0.0