# Multi-AI Support Implementation

## Overview
Ledebe Protector now supports multiple AI providers simultaneously! You can use ChatGPT, Claude, and Gemini at the same time, each with their own API keys.

## Features Added

### 1. Multiple AI Plugins
- **ChatGPT (OpenAI)**: GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo
- **Claude (Anthropic)**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Gemini (Google)**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro

### 2. Checkbox Selection Interface
Instead of a dropdown, you now have checkboxes in the sidebar to:
- ✅ Enable/disable each AI provider
- 🔑 See which AIs have API keys configured
- ⚙️ Configure all API keys in one place

### 3. Multiple API Keys
Each AI provider has its own API key configuration:
- OpenAI API Key for ChatGPT
- Anthropic API Key for Claude
- Google AI API Key for Gemini

### 4. Simultaneous Responses
When you send a message:
- All enabled AIs receive your message (with PII protection)
- Each AI responds independently
- Responses are labeled with the AI name
- Errors are shown per AI if any fail

## How to Use

### Step 1: Configure API Keys
1. Click "Configure API Keys" button in the sidebar
2. For each AI you want to use:
   - Click the "Get API Key" link to get your key
   - Paste the API key in the field
   - Select your preferred model
   - Settings auto-save

### Step 2: Enable AI Providers
1. Check the boxes next to the AIs you want to use
2. You can enable one, two, or all three
3. Only AIs with configured API keys can be enabled

### Step 3: Start Chatting
1. Type your message
2. Click Send
3. All enabled AIs will respond
4. Each response is labeled with the AI name

## API Key Links

### OpenAI (ChatGPT)
- Get API Key: https://platform.openai.com/api-keys
- Pricing: https://openai.com/pricing

### Anthropic (Claude)
- Get API Key: https://console.anthropic.com/account/keys
- Pricing: https://www.anthropic.com/pricing

### Google (Gemini)
- Get API Key: https://aistudio.google.com/app/apikey
- Pricing: https://ai.google.dev/pricing

## Files Modified

### New Files
1. `src/plugins/ClaudePlugin.ts` - Claude AI integration
2. `src/plugins/GeminiPlugin.ts` - Gemini AI integration

### Modified Files
1. `src/plugins/PluginManager.ts`
   - Added Claude and Gemini plugin loading
   - Added enabled plugins tracking
   - Added methods to get/set enabled plugins

2. `src/plugins/ChatInterface.ts`
   - Replaced dropdown with checkbox interface
   - Updated settings modal to show all AI configurations
   - Modified sendMessage to support multiple AIs
   - Added displayAIMessage and displayAIError methods
   - Updated welcome message with new instructions

3. `src/plugins/index.ts`
   - Exported new Claude and Gemini plugins

## Benefits

### 1. Compare AI Responses
Get different perspectives on the same question from multiple AIs

### 2. Redundancy
If one AI is down or rate-limited, others still work

### 3. Cost Optimization
Use cheaper models (Gemini Flash) for simple tasks, premium models (GPT-4, Claude Opus) for complex ones

### 4. Best of Each
- ChatGPT: Great for general knowledge and coding
- Claude: Excellent for analysis and long-form content
- Gemini: Fast and cost-effective for quick responses

## Privacy & Security

✅ All PII protection still works
✅ API keys stored locally only
✅ Each AI gets masked data
✅ Responses are unmasked before display

## Example Usage

```
You: "My email is john@example.com and I need help with Python"

[Message sent with PII masked to all enabled AIs]

ChatGPT: "I'd be happy to help with Python! What specific topic..."
Claude: "Python is a versatile language. What would you like to learn..."
Gemini: "I can assist with Python programming. Please share more details..."
```

## Troubleshooting

### Checkbox is Disabled
⚠️ You need to configure the API key first
→ Click "Configure API Keys" and add the key

### AI Not Responding
❌ Check if the API key is valid
→ Click the "Get API Key" link to verify

### Rate Limit Errors
⏱️ You've hit the API rate limit
→ Wait a few minutes or use a different AI

## Future Enhancements

- [ ] Select which AIs to use per message
- [ ] Compare responses side-by-side
- [ ] Vote on best response
- [ ] Cost tracking per AI
- [ ] Response time comparison
- [ ] Custom AI routing rules

## Support

For issues or questions:
- Check API key configuration
- Verify internet connection
- Review console logs for errors
- Ensure API keys have sufficient credits
