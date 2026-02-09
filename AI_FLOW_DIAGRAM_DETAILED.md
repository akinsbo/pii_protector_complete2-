# AI Integration Flow Diagram

## Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER OPENS APP                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Chat Initializes                             │
│  • Loads settings from localStorage                          │
│  • Logs: "✅ AI Chat initialized successfully"              │
│  • Or: "❌ Failed to initialize AI Chat"                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Opens Settings                             │
│  • Clicks ⚙️ button                                         │
│  • Sees AI Integration section                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Configures AI                              │
│  1. ✅ Enable AI Chat Integration                           │
│  2. Select Provider (OpenAI/Anthropic/Google)               │
│  3. Enter API Key                                            │
│  4. Click "📡 Test Connection" ← NEW FEATURE!               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Test Connection                                 │
│  • Creates temporary AI instance                             │
│  • Sends test message: "Hello, this is a test..."          │
│  • Waits for response                                        │
│  • Shows result:                                             │
│    ✅ "Connection successful! AI is working."               │
│    ❌ "Test failed: [specific error]"                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Save Settings                                   │
│  • Stores in localStorage                                    │
│  • Reinitializes AI Chat                                     │
│  • Shows: "✅ Settings saved successfully!"                 │
└─────────────────────────────────────────────────────────────┘
```

## Message Flow (Using AI)

```
┌─────────────────────────────────────────────────────────────┐
│              User Types Message                              │
│  "Hello, my email is john@example.com"                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Click Send                                      │
│  • Detects PII (email, phone, custom terms)                 │
│  • Creates placeholders: [LDB_EMAIL1]                       │
│  • Displays message with 🤖 button                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Clicks 🤖 Button                          │
│  • Logs: "🤖 askAI called for message: msg-1"              │
│  • Checks if AI configured                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  Not Configured  │  │   Configured     │
        │  ❌ Show error   │  │   ✅ Continue    │
        │  Open Settings   │  │                  │
        └──────────────────┘  └──────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Send to AI                                      │
│  • Protected text: "Hello, my email is [LDB_EMAIL1]"       │
│  • Shows: "🤖 Asking AI..."                                │
│  • Logs: "Protected text to send: Hello, my email..."      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Provider (OpenAI/Anthropic/Google)          │
│  • Receives protected text                                   │
│  • Processes request                                         │
│  • Returns response with placeholders                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │     Success      │  │      Error       │
        │  ✅ Got response │  │  ❌ Show error   │
        │                  │  │  • Invalid key   │
        │                  │  │  • Rate limit    │
        │                  │  │  • Network       │
        └──────────────────┘  └──────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Restore PII                                     │
│  • AI response: "I see your email is [LDB_EMAIL1]"         │
│  • Replace placeholders with original values                │
│  • Restored: "I see your email is john@example.com"        │
│  • Logs: "✅ AI response received"                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Display Response                                │
│  • Shows AI message in chat                                  │
│  • Two tabs:                                                 │
│    - "With Your Info" (restored)                            │
│    - "Protected Version" (placeholders)                     │
│  • Shows: "✅ AI responded!"                                │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Error Occurs                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Identify Error Type                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 401/Auth     │  │ 429/Rate     │  │ Network      │
│ Error        │  │ Limit        │  │ Error        │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ "Invalid     │  │ "Rate limit  │  │ "Network     │
│ API key.     │  │ exceeded.    │  │ error.       │
│ Check        │  │ Try again    │  │ Check        │
│ settings."   │  │ later."      │  │ connection." │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Show Error Toast                                │
│  • Red toast notification                                    │
│  • Specific error message                                    │
│  • Logs detailed error to console                           │
└─────────────────────────────────────────────────────────────┘
```

## Test Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│              User Clicks "Test Connection"                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Validate Input                                  │
│  • Check if AI enabled                                       │
│  • Check if API key entered                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  Invalid Input   │  │   Valid Input    │
        │  ❌ Show error   │  │   ✅ Continue    │
        └──────────────────┘  └──────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Create Test AI Instance                         │
│  • Uses current form values (not saved yet)                 │
│  • Shows: "📡 Testing connection to [provider]..."         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Send Test Message                               │
│  • Message: "Hello, this is a test. Respond with           │
│              'Test successful'."                            │
│  • No context (single message)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │     Success      │  │      Error       │
        │  ✅ Got response │  │  ❌ API error    │
        └──────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ "✅ Connection   │  │ "❌ Test failed: │
        │ successful!      │  │ [specific error]"│
        │ AI is working."  │  │                  │
        └──────────────────┘  └──────────────────┘
```

## Console Logging Flow

```
App Start
  │
  ├─ ✅ AI Chat initialized: { provider: 'openai', enabled: true, hasKey: true }
  │
User Opens Settings
  │
  ├─ AI isConfigured: true { enabled: true, hasKey: true }
  │
User Clicks Test Connection
  │
  ├─ 📡 Testing connection to openai...
  ├─ AI sendMessage called: { textLength: 50, hasPlaceholders: false }
  ├─ ✅ Test successful: { protected: "...", restored: "..." }
  │
User Clicks 🤖 Button
  │
  ├─ 🤖 askAI called for message: msg-1
  ├─ AI isConfigured: true { enabled: true, hasKey: true }
  ├─ Protected text to send: Hello, my email is [LDB_EMAIL1]...
  ├─ AI sendMessage called: { textLength: 100, hasPlaceholders: true }
  ├─ ✅ AI response received
  │
Error Occurs
  │
  └─ ❌ AI Error Details: { message: "...", stack: "...", provider: "openai" }
```

## Key Components

### 1. AIChat Class (`ai-chat.js`)
- Manages AI provider connections
- Handles API calls
- Restores PII in responses

### 2. askAI() Function (`index.html`)
- Triggered by 🤖 button
- Validates configuration
- Shows loading state
- Handles errors

### 3. testAIConnection() Function (`index.html`)
- NEW: Tests API key before saving
- Validates configuration
- Provides immediate feedback

### 4. Settings Modal (`index.html`)
- UI for configuration
- Enable/disable AI
- Select provider
- Enter API key
- Test connection

## Data Flow

```
User Input → Protect PII → Send to AI → AI Response → Restore PII → Display
     ↓            ↓             ↓            ↓             ↓           ↓
  "john@..."  [LDB_EMAIL1]  API Call    "[LDB_EMAIL1]"  "john@..."  Show
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│              User's Browser (localStorage)                   │
│  • API Key stored locally                                    │
│  • Never sent to Ledebe servers                             │
│  • Only sent to chosen AI provider                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Direct API Call                                 │
│  Browser → AI Provider (OpenAI/Anthropic/Google)            │
│  • No intermediary servers                                   │
│  • HTTPS encrypted                                           │
└─────────────────────────────────────────────────────────────┘
```

---

This diagram shows the complete flow of the AI integration, including the new Test Connection feature and enhanced error handling!
