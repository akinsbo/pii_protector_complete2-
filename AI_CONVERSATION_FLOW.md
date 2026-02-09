# AI Conversation Flow - How PII Protection Works

## The Problem You Asked About

**Question**: "If I'm chatting with AI, how does it respond with protected text?"

**Answer**: The AI maintains conversation context using **placeholders**, and you see the **restored version**.

---

## How It Works

### Example Conversation

**Turn 1:**
- **You type**: "My name is John Smith and my email is john@email.com"
- **AI receives**: "My name is [NAME_1] and my email is [EMAIL_1]"
- **AI responds**: "Nice to meet you [NAME_1]! I've noted your email [EMAIL_1]"
- **You see**: "Nice to meet you John Smith! I've noted your email john@email.com"

**Turn 2:**
- **You type**: "Can you send a reminder to that email?"
- **AI receives**: "Can you send a reminder to that email?" (with previous context)
- **AI responds**: "I'll send a reminder to [EMAIL_1]"
- **You see**: "I'll send a reminder to john@email.com"

---

## Key Points

1. **AI never sees your real PII** - It only works with placeholders like [NAME_1], [EMAIL_1]
2. **Conversation context is maintained** - AI remembers previous messages (with placeholders)
3. **You always see restored text** - The app automatically replaces placeholders with your real data
4. **Both views available** - Toggle between "Protected" and "Restored" to see what AI actually saw

---

## Technical Implementation

```javascript
// Conversation history stored with placeholders
conversationHistory = [
  { role: 'user', content: 'My name is [NAME_1]' },
  { role: 'assistant', content: 'Nice to meet you [NAME_1]!' },
  { role: 'user', content: 'Send reminder to [EMAIL_1]' },
  { role: 'assistant', content: 'I'll send to [EMAIL_1]' }
]

// Placeholder map for restoration
placeholderMap = {
  '[NAME_1]': 'John Smith',
  '[EMAIL_1]': 'john@email.com'
}
```

---

## New Chat = Fresh Start

When you click "New Chat", the conversation history clears:
- AI forgets previous placeholders
- New placeholders are generated
- Fresh conversation context

This prevents placeholder confusion across different conversations.

---

## Why This Approach?

✅ **Privacy**: Your PII never leaves your device in plain text  
✅ **Context**: AI can have natural conversations  
✅ **Transparency**: You can see exactly what AI received (Protected view)  
✅ **Usability**: You see natural responses (Restored view)

---

## Future Enhancement Ideas

1. **Persistent placeholder mapping** across sessions
2. **Conversation export** with both protected/restored versions
3. **Team shared placeholder library** for consistent protection
4. **Audit log** showing what was sent to AI

