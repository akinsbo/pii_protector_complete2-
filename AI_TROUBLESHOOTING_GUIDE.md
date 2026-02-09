# AI Integration Troubleshooting Guide

## Quick Diagnosis

### Step 1: Check if AI is Enabled
1. Open the app
2. Click **⚙️ Settings** in the top right
3. Look for **🤖 Enable AI Chat Integration** checkbox
4. Make sure it's **checked**

### Step 2: Verify API Key
1. In Settings, scroll to the AI section
2. Select your AI provider (OpenAI, Anthropic, or Google)
3. Enter your API key
4. Click **📡 Test Connection** button
5. You should see "✅ Connection successful!"

### Step 3: Test the AI Button
1. Type a message with some text (e.g., "Hello, my email is john@example.com")
2. Click **Send**
3. You should see your message with a **🤖 Ask AI** button
4. Click the **🤖** button
5. Wait for AI response

## Common Issues & Solutions

### Issue 1: "AI not configured" Error
**Symptoms:** When you click 🤖, you see "Please configure AI in Settings first"

**Solution:**
1. Go to Settings (⚙️)
2. Check the "Enable AI Chat Integration" box
3. Enter your API key
4. Click "Save Settings"
5. Try again

### Issue 2: "Invalid API Key" Error
**Symptoms:** Test connection fails with authentication error

**Solution:**
1. Verify your API key is correct
2. For OpenAI: Get key from https://platform.openai.com/api-keys
3. For Anthropic: Get key from https://console.anthropic.com/
4. For Google: Get key from https://makersuite.google.com/app/apikey
5. Make sure you copied the entire key (no spaces)
6. Try generating a new API key

### Issue 3: Network/CORS Errors
**Symptoms:** "Network error" or "CORS" in error message

**Solution:**
This is a browser security limitation. The AI integration works best when:
1. Running as an Electron app (not in browser)
2. Using a proxy server (advanced)
3. Try a different AI provider

**Workaround:**
- Copy the protected text manually
- Paste it into ChatGPT/Claude directly
- Copy the response back

### Issue 4: AI Button Not Visible
**Symptoms:** No 🤖 button appears after sending message

**Solution:**
1. Check browser console (F12) for errors
2. Refresh the page (Ctrl+R or Cmd+R)
3. Clear browser cache
4. Make sure `ai-chat.js` is loaded (check Network tab)

### Issue 5: Rate Limit Errors
**Symptoms:** "Rate limit exceeded" or "429" error

**Solution:**
1. Wait a few minutes before trying again
2. Check your API usage limits
3. Upgrade your API plan if needed
4. Use a different API key

## How to Get API Keys

### OpenAI (ChatGPT)
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Click on your profile → "View API keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Paste into Ledebe Settings

### Anthropic (Claude)
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Create Key"
5. Copy the key
6. Paste into Ledebe Settings

### Google (Gemini)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Paste into Ledebe Settings

## Testing Checklist

Use this checklist to verify everything is working:

- [ ] Settings → AI Integration is enabled
- [ ] API key is entered
- [ ] Test Connection shows "✅ Connection successful"
- [ ] Can send a message
- [ ] 🤖 button appears on message
- [ ] Clicking 🤖 shows "Asking AI..." status
- [ ] AI response appears in chat
- [ ] Can switch between "With Your Info" and "Protected Version" tabs

## Debug Mode

To see detailed logs:
1. Open browser console (F12)
2. Look for messages starting with:
   - `✅ AI Chat initialized`
   - `🤖 askAI called`
   - `✅ AI response received`
3. Any errors will show with `❌`

## Still Not Working?

If you've tried everything above:

1. **Check Console Logs:**
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for red error messages
   - Take a screenshot

2. **Verify File Loading:**
   - In Developer Tools, go to Network tab
   - Refresh the page
   - Look for `ai-chat.js` - should show 200 status
   - If 404, the file is missing

3. **Test in Different Browser:**
   - Try Chrome, Firefox, or Edge
   - Some browsers have stricter security

4. **Use Electron App:**
   - The AI works best in the desktop app
   - Run: `npm run dev:electron`
   - Or use the installed app

## Alternative: Manual AI Usage

If AI integration doesn't work, you can still use AI manually:

1. Send your message in Ledebe
2. Click the **Protected Text** tab
3. Click **📋 Copy** button
4. Open ChatGPT/Claude in your browser
5. Paste the protected text
6. Get AI response
7. Copy response back to Ledebe

This way, your PII is still protected!

## Technical Details

### How It Works
1. Your text is protected (PII replaced with placeholders)
2. Protected text is sent to AI API
3. AI responds using placeholders
4. Ledebe restores your real info in the response

### Security
- API keys stored in browser localStorage (local only)
- Keys never sent to Ledebe servers
- All AI calls go directly from your browser to AI provider
- Your data is only seen by you and the AI provider you choose

### Supported Providers
- **OpenAI**: GPT-3.5-turbo (fast, affordable)
- **Anthropic**: Claude-3-sonnet (smart, detailed)
- **Google**: Gemini-pro (free tier available)

## Need More Help?

- Check the main README.md for general app help
- Review AI_INTEGRATION_COMPLETE.md for technical details
- Open an issue on GitHub with console logs
