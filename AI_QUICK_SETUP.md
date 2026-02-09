# 🤖 AI Integration - Quick Setup Guide

## 5-Minute Setup

### Step 1: Get an API Key (Choose One)

#### Option A: OpenAI (ChatGPT) - Most Popular
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Cost:** ~$0.002 per message

#### Option B: Anthropic (Claude) - Best Quality
1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Create API key
4. Copy the key
5. **Cost:** ~$0.003 per message

#### Option C: Google (Gemini) - Free Tier
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Copy the key
5. **Cost:** Free up to 60 requests/minute

### Step 2: Configure Ledebe

1. Open Ledebe Protector
2. Click **⚙️ Settings** (top right)
3. Scroll to **🤖 Enable AI Chat Integration**
4. ✅ Check the box
5. Select your provider (OpenAI/Anthropic/Google)
6. Paste your API key
7. Click **📡 Test Connection**
8. Wait for "✅ Connection successful!"
9. Click **💾 Save Settings**

### Step 3: Use It!

1. Type a message with PII: "My email is john@example.com"
2. Click **Send**
3. Click the **🤖** button on your message
4. Wait 5-10 seconds
5. See AI response with your info restored!

## Quick Troubleshooting

### ❌ "AI not configured"
→ Go to Settings, enable AI, add API key

### ❌ "Invalid API key"
→ Check you copied the full key, try Test Connection

### ❌ "Network error"
→ Check internet connection, try different provider

### ❌ No 🤖 button appears
→ Refresh page, check console (F12) for errors

## How It Works

```
Your Text → Protect PII → Send to AI → Get Response → Restore PII
```

**Example:**
```
Input:  "My email is john@example.com"
To AI:  "My email is [LDB_EMAIL1]"
AI:     "I see your email is [LDB_EMAIL1]"
Output: "I see your email is john@example.com"
```

## Cost Estimates

Based on typical usage:

| Provider   | Per Message | 100 Messages | 1000 Messages |
|------------|-------------|--------------|---------------|
| OpenAI     | $0.002      | $0.20        | $2.00         |
| Anthropic  | $0.003      | $0.30        | $3.00         |
| Google     | Free*       | Free*        | Free*         |

*Google: Free tier = 60 requests/minute, 1500/day

## Privacy & Security

✅ **Your API key is stored locally** (in your browser only)
✅ **Never sent to Ledebe servers**
✅ **Only you and your chosen AI provider see your data**
✅ **PII is protected before sending to AI**
✅ **You can delete your key anytime** (Settings → Clear)

## Tips

💡 **Use Protected Text Tab** - Always verify what's sent to AI
💡 **Test Connection First** - Saves time debugging later
💡 **Start with Google** - Free tier is great for testing
💡 **Check Console** - Press F12 to see detailed logs
💡 **Manual Fallback** - Copy protected text to AI website if needed

## Need Help?

📖 **Full Guide:** `AI_TROUBLESHOOTING_GUIDE.md`
🔧 **Technical Details:** `AI_INTEGRATION_COMPLETE.md`
💬 **Support:** Open an issue on GitHub

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Send message
- `Ctrl/Cmd + K` - New chat
- `Ctrl/Cmd + Shift + C` - Copy protected text
- `Ctrl/Cmd + /` - Show shortcuts

---

**That's it! You're ready to use AI with protected data! 🎉**
