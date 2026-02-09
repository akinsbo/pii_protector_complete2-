# Environment Variables Setup

This document explains how to configure environment variables for the Ledebe Protector application.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   nano .env
   # or use your preferred editor
   ```

3. **Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.

## Available Environment Variables

### GitHub Integration (Optional)
Used for crash reporting and feedback storage:

```bash
GITHUB_TOKEN=your_github_personal_access_token
CRASH_GIST_ID=your_gist_id_for_crash_reports
```

**How to get these:**
1. Create a GitHub Personal Access Token at https://github.com/settings/tokens
2. Create a new Gist at https://gist.github.com/
3. Copy the Gist ID from the URL

### Slack Notifications (Optional)
For real-time crash notifications:

```bash
CRASH_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**How to get this:**
1. Go to your Slack workspace settings
2. Create an Incoming Webhook
3. Copy the webhook URL

### AI Configuration (Optional)
Default AI model and API keys:

```bash
DEFAULT_AI_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

**Note**: Users can also set their API keys through the Settings UI in the application. Environment variables are just defaults.

## User Settings (In-App)

Users can configure their AI API keys directly in the application:

1. Click the **⚙️ Settings** button in the header
2. Enable **🤖 Enable AI Chat Integration**
3. Select your AI provider (OpenAI, Anthropic, or Google)
4. Enter your API key
5. Click **💾 Save Settings**

**Security**: API keys entered in the Settings UI are stored in `localStorage` on the user's machine and never sent to any server.

## Settings Storage

The application stores user settings in two places:

### Web App (index.html)
- Uses `localStorage` in the browser
- Settings persist across sessions
- Stored locally on user's machine

### Electron App (main.ts)
- Uses filesystem storage in `~/.ledebe-settings.json`
- Settings persist across app restarts
- Stored in user's home directory

## Troubleshooting

### "Save Settings" button not working

If the Save Settings button doesn't work:

1. **Check browser console** for errors (F12 → Console tab)
2. **Clear localStorage** and try again:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```
3. **Check if localStorage is enabled** in your browser settings

### API Key not being saved

1. Make sure you clicked **💾 Save Settings** after entering the key
2. Check that the AI integration checkbox is enabled
3. Verify the key format is correct for your provider:
   - OpenAI: starts with `sk-`
   - Anthropic: starts with `sk-ant-`
   - Google: varies

### Environment variables not loading

1. Make sure `.env` file is in the project root directory
2. Restart the application after changing `.env`
3. Check that variable names match exactly (case-sensitive)

## Security Best Practices

1. **Never commit `.env` to git** - it's in `.gitignore` by default
2. **Use different keys for development and production**
3. **Rotate API keys regularly**
4. **Limit API key permissions** to only what's needed
5. **Monitor API usage** for unexpected activity

## Example Configuration

Here's a complete example `.env` file:

```bash
# GitHub configuration
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
CRASH_GIST_ID=your-username

# Slack notifications
CRASH_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# AI defaults
DEFAULT_AI_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyz
```

## Need Help?

- Check the main [README.md](README.md) for general setup instructions
- See [docs/MANAGEMENT_SETUP.md](docs/MANAGEMENT_SETUP.md) for deployment details
- Open an issue on GitHub if you encounter problems
