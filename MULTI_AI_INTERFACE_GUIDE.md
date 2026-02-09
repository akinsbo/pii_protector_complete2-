# Multi-AI Interface Guide

## New Sidebar Layout

```
┌─────────────────────────────────┐
│  🤖 Select AI Models            │
├─────────────────────────────────┤
│  ☑ ChatGPT (OpenAI)         ✅  │
│  ☑ Claude (Anthropic)       ✅  │
│  ☐ Gemini (Google)          ⚠️  │
├─────────────────────────────────┤
│  ⚙️ Configure API Keys          │
└─────────────────────────────────┘

Legend:
☑ = Enabled (checked)
☐ = Disabled (unchecked)
✅ = API key configured
⚠️ = API key required
```

## Settings Modal Layout

```
┌──────────────────────────────────────────┐
│  🔧 AI Plugin Settings              ×    │
├──────────────────────────────────────────┤
│                                          │
│  ChatGPT (OpenAI)                        │
│  ────────────────────────────────────    │
│                                          │
│  OpenAI API Key                          │
│  [sk-..............................]     │
│  🔑 Get your API key from OpenAI →       │
│                                          │
│  ChatGPT Model                           │
│  [gpt-3.5-turbo ▼]                      │
│                                          │
│  Temperature                             │
│  [0.7]                                   │
│                                          │
│  Max Tokens                              │
│  [2048]                                  │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  Claude (Anthropic)                      │
│  ────────────────────────────────────    │
│                                          │
│  Anthropic API Key                       │
│  [sk-ant-...........................]    │
│  🤖 Get your API key from Anthropic →    │
│                                          │
│  Claude Model                            │
│  [claude-3-5-sonnet-20241022 ▼]        │
│                                          │
│  Temperature                             │
│  [1.0]                                   │
│                                          │
│  Max Tokens                              │
│  [4096]                                  │
│                                          │
│  ──────────────────────────────────────  │
│                                          │
│  Gemini (Google)                         │
│  ────────────────────────────────────    │
│                                          │
│  Google AI API Key                       │
│  [AIza................................]  │
│  💎 Get your API key from Google AI →    │
│                                          │
│  Gemini Model                            │
│  [gemini-1.5-flash ▼]                   │
│                                          │
│  Temperature                             │
│  [0.9]                                   │
│                                          │
│  Max Tokens                              │
│  [8192]                                  │
│                                          │
│  ✅ Settings auto-save as you type       │
│  🔑 Need help? Click the blue links      │
│  ✕ Use the × button to close            │
└──────────────────────────────────────────┘
```

## Chat Response Layout

```
┌──────────────────────────────────────────┐
│  👤 You                                   │
│  ┌────────────────────────────────────┐  │
│  │ My email is john@example.com       │  │
│  │ Can you help me with Python?       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ ChatGPT (OpenAI)                    │ │
│  ├─────────────────────────────────────┤ │
│  │ I'd be happy to help with Python!   │ │
│  │ What specific topic would you like  │ │
│  │ to learn about?                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Claude (Anthropic)                  │ │
│  ├─────────────────────────────────────┤ │
│  │ Python is a versatile language.     │ │
│  │ I can help with syntax, libraries,  │ │
│  │ or best practices. What interests   │ │
│  │ you most?                           │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Gemini (Google)                     │ │
│  ├─────────────────────────────────────┤ │
│  │ I can assist with Python! Whether   │ │
│  │ you're a beginner or advanced, I'm  │ │
│  │ here to help. What would you like   │ │
│  │ to know?                            │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Error Handling Example

```
┌──────────────────────────────────────────┐
│  👤 You                                   │
│  ┌────────────────────────────────────┐  │
│  │ Tell me about machine learning     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ ChatGPT (OpenAI)                    │ │
│  ├─────────────────────────────────────┤ │
│  │ Machine learning is a subset of AI  │ │
│  │ that enables systems to learn...    │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ Gemini (Google)                     │ │
│  ├─────────────────────────────────────┤ │
│  │ ❌ Gemini API error: Invalid API    │ │
│  │ key                                 │ │
│  │                                     │ │
│  │ [💎 Get Gemini API Key]             │ │
│  │                                     │ │
│  │ Then click "Configure API Keys"     │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Workflow Diagram

```
User Types Message
       ↓
   Click Send
       ↓
   ┌───────────────────────────────┐
   │  PII Protection Applied       │
   │  (john@example.com → [EMAIL]) │
   └───────────────────────────────┘
       ↓
   ┌───────────────────────────────┐
   │  Send to All Enabled AIs      │
   ├───────────────────────────────┤
   │  → ChatGPT (if enabled)       │
   │  → Claude (if enabled)        │
   │  → Gemini (if enabled)        │
   └───────────────────────────────┘
       ↓
   ┌───────────────────────────────┐
   │  Collect Responses            │
   ├───────────────────────────────┤
   │  ✅ ChatGPT: "I can help..."  │
   │  ✅ Claude: "Python is..."    │
   │  ❌ Gemini: API Error         │
   └───────────────────────────────┘
       ↓
   ┌───────────────────────────────┐
   │  Restore PII in Responses     │
   │  ([EMAIL] → john@example.com) │
   └───────────────────────────────┘
       ↓
   Display All Responses
   (Each labeled with AI name)
```

## Quick Start Steps

1. **Open AI Chat**
   - Click the AI Chat button in main app

2. **Configure API Keys**
   ```
   Click "Configure API Keys"
   → Add OpenAI key for ChatGPT
   → Add Anthropic key for Claude
   → Add Google AI key for Gemini
   → Keys auto-save
   ```

3. **Enable AIs**
   ```
   Check boxes for AIs you want:
   ☑ ChatGPT
   ☑ Claude
   ☑ Gemini
   ```

4. **Start Chatting**
   ```
   Type message → Send
   → All enabled AIs respond
   → Compare responses
   ```

## Tips

### Cost Optimization
- Use Gemini Flash for quick questions (cheapest)
- Use GPT-3.5 for general tasks (balanced)
- Use Claude Opus or GPT-4 for complex analysis (premium)

### Best Practices
- Enable multiple AIs to compare responses
- Check API key status icons (✅ vs ⚠️)
- Configure all keys at once in settings
- Disable unused AIs to save API calls

### Troubleshooting
- ⚠️ Icon = Need to add API key
- ❌ Error = Check API key validity
- Checkbox disabled = Configure key first
- No response = Check internet connection
```
