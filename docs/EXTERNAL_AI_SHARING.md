# External AI Sharing Feature

## Overview

The External AI Sharing feature allows users to easily use their protected text with external AI services, especially helpful for users who don't have subscriptions to premium AI services.

## How It Works

### 1. **Share with External AI Button**
After protecting text, users see a "🌐 Share with External AI" button that opens a modal with multiple options.

### 2. **Supported AI Services**
- **ChatGPT** (OpenAI) - Free tier available
- **Gemini** (Google) - Free tier available  
- **Claude** (Anthropic) - Free tier available
- **Copilot** (Microsoft) - Free with Microsoft account
- **Perplexity** - Free tier available
- **Other AI** - Universal copy option for any service

### 3. **One-Click Process**
1. Click any AI service card
2. Protected text is automatically copied to clipboard
3. AI service opens in new tab/window
4. User pastes and gets response
5. User copies AI response back to restore personal info

### 4. **Universal Copy Format**
For maximum compatibility, the app formats the protected text as:

```
Here's my text with personal information safely protected:

[PROTECTED TEXT]

Please help me with this text. When you respond, I'll restore my personal information back into your response.
```

## Benefits for Unsubscribed Users

### Free Tier Access
- **ChatGPT**: Free tier with GPT-3.5
- **Gemini**: Generous free tier
- **Claude**: Free tier available
- **Copilot**: Free with any Microsoft account
- **Perplexity**: Free searches with AI

### No API Keys Required
Unlike the built-in AI chat, external sharing doesn't require API keys - users can use the web interfaces directly.

### Multiple Options
If one service is unavailable or limited, users can easily try another service with the same protected text.

## Privacy & Security

- Personal information is already protected before sharing
- No data is sent through our servers
- Users maintain full control over their data
- Works entirely through clipboard and browser

## Usage Instructions

1. **Protect Your Text**: Use the main app to protect personal information
2. **Click Share Button**: Select "🌐 Share with External AI"
3. **Choose AI Service**: Click any service card to copy text and open service
4. **Paste & Chat**: Paste the protected text into the AI service
5. **Copy Response**: Copy the AI's response
6. **Restore Info**: Paste back into the app to restore personal information

## Technical Implementation

- Uses `navigator.clipboard.writeText()` for copying
- Falls back to `document.execCommand('copy')` for older browsers
- Opens external services using `window.electronAPI.openExternal()` in Electron or `window.open()` in browsers
- No external dependencies or API calls required

## Future Enhancements

- Add more AI services as they become available
- Custom formatting options for different AI services
- Integration with browser extensions
- Batch processing for multiple texts