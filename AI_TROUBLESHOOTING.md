# AI Chat Troubleshooting Guide

## Issue: "I posted a sample but didn't get a response from AI"

### Step 1: Check Browser Console

1. **Open DevTools**: Press `F12` or right-click → Inspect
2. **Go to Console tab**
3. **Look for red error messages**

Common errors you might see:

#### Error: "AI not configured. Please add your API key in Settings."
**Solution**: 
- Click ⚙️ Settings button
- Check "🤖 Enable AI Chat Integration"
- Select your AI provider (OpenAI, Anthropic, or Google)
- Enter your API key
- Click "Save Settings"

#### Error: "401 Unauthorized" or "Invalid API key"
**Solution**: Your API key is incorrect
- Get a new API key from your provider:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/settings/keys
  - Google: https://makersuite.google.com/app/apikey
- Update it in Settings

#### Error: "429 Too Many Requests" or "Rate limit exceeded"
**Solution**: You've hit your API rate limit
- Wait a few minutes and try again
- Check your API usage dashboard
- Upgrade your API plan if needed

#### Error: "Network error" or "Failed to fetch"
**Solution**: Connection issue
- Check your internet connection
- Check if the AI service is down (status.openai.com)
- Try a different AI provider

---

## Step 2: Verify Settings

Open Settings (⚙️ button) and check:

✅ **AI Chat Integration is ENABLED** (checkbox checked)  
✅ **AI Provider is selected** (OpenAI, Anthropic, or Google)  
✅ **API Key is entered** (should show dots: •••••••)  

---

## Step 3: Test with Simple Message

1. Type: "Hello, test message"
2. Click Send
3. Click the 🤖 button on your message
4. Wait 5-10 seconds

**Expected behavior**:
- Send button changes to "🤖 Asking AI..."
- Toast notification: "🤖 Sending to AI..."
- AI response appears below your message
- Toast notification: "✅ AI responded!"

---

## Step 4: Check API Key Format

Different providers have different key formats:

**OpenAI**: `sk-proj-...` or `sk-...` (starts with "sk-")  
**Anthropic**: `sk-ant-...` (starts with "sk-ant-")  
**Google**: Long alphanumeric string (no prefix)

If your key doesn't match these patterns, it might be invalid.

---

## Step 5: Test API Key Manually

### For OpenAI:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### For Anthropic:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### For Google:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello"}]}]
  }'
```

If these commands fail, your API key is definitely invalid.

---

## Step 6: Check localStorage

Open Console and type:
```javascript
console.log('AI Enabled:', localStorage.getItem('aiEnabled'));
console.log('AI Provider:', localStorage.getItem('aiProvider'));
console.log('AI Key:', localStorage.getItem('aiKey') ? '✓ Set' : '✗ Not set');
```

**Expected output**:
```
AI Enabled: true
AI Provider: openai
AI Key: ✓ Set
```

If any of these are wrong, go back to Settings and fix them.

---

## Step 7: Clear Cache and Reload

Sometimes settings don't save properly:

1. Open Settings
2. Re-enter your API key
3. Click "Save Settings"
4. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. Try again

---

## Still Not Working?

### Check Network Tab

1. Open DevTools → Network tab
2. Click 🤖 button
3. Look for requests to:
   - `api.openai.com`
   - `api.anthropic.com`
   - `generativelanguage.googleapis.com`

**If you see the request**:
- Click on it
- Check "Response" tab
- Look for error message

**If you DON'T see the request**:
- JavaScript error is preventing the call
- Check Console tab for errors

---

## Common Mistakes

❌ **Forgot to enable AI** - Checkbox not checked  
❌ **Wrong API key** - Copied incorrectly or expired  
❌ **No API credits** - Free tier exhausted  
❌ **CORS error** - Browser blocking request (shouldn't happen with these APIs)  
❌ **Old browser** - Update to latest Chrome/Firefox/Safari  

---

## Quick Debug Script

Paste this in Console to diagnose:

```javascript
(async function() {
  console.log('=== AI Chat Debug ===');
  console.log('Enabled:', localStorage.getItem('aiEnabled'));
  console.log('Provider:', localStorage.getItem('aiProvider'));
  console.log('Key exists:', !!localStorage.getItem('aiKey'));
  
  const aiChat = new AIChat();
  console.log('Configured:', aiChat.isConfigured());
  
  if (aiChat.isConfigured()) {
    console.log('Testing API call...');
    try {
      const result = await aiChat.sendMessage('Test', {}, false);
      console.log('✅ SUCCESS:', result);
    } catch (error) {
      console.error('❌ ERROR:', error.message);
    }
  } else {
    console.log('❌ AI not configured properly');
  }
})();
```

This will tell you exactly what's wrong!

---

## Get Help

If none of this works, share:
1. Browser console errors (screenshot)
2. Network tab response (screenshot)
3. Output from debug script above

