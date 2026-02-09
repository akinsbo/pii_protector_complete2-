# 🔄 AI Chat Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEDEBE PROTECTOR AI CHAT                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Types Message                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: "My email is john@example.com and phone is 555-1234"   │
│                                                                  │
│  [Send Button] ──────────────────────────────────────────────▶  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: PII Detection & Protection                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Original:  "My email is john@example.com and phone is 555-1234"│
│                                                                  │
│  Protected: "My email is [LDB_EMAIL1] and phone is [LDB_PHONE1]"│
│                                                                  │
│  Placeholder Map:                                               │
│  • [LDB_EMAIL1] → john@example.com                             │
│  • [LDB_PHONE1] → 555-1234                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Message Displayed                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 You                                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ My email is [LDB_EMAIL1] and phone is [LDB_PHONE1]       │ │
│  │                                                            │ │
│  │ [Plain Text] [Protected Text ✓]                          │ │
│  │                                                            │ │
│  │ [🤖 Ask AI] [📋 Copy] [✏️ Edit] [🗑️ Delete]              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User clicks 🤖 Ask AI
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Send to AI (Protected)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Browser    │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │ HTTPS Request                                         │
│         │ "My email is [LDB_EMAIL1] and phone is [LDB_PHONE1]" │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │  OpenAI API  │  (or Anthropic/Google)                       │
│  │  ChatGPT     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │ AI sees ONLY placeholders                             │
│         │ No real PII exposed!                                  │
│         │                                                        │
└─────────┴───────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: AI Responds (With Placeholders)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AI Response:                                                    │
│  "I can help! I'll send information to [LDB_EMAIL1] and        │
│   call you at [LDB_PHONE1]"                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Restore PII in Response                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Protected: "I can help! I'll send information to [LDB_EMAIL1] │
│              and call you at [LDB_PHONE1]"                     │
│                                                                  │
│  Restored:  "I can help! I'll send information to              │
│              john@example.com and call you at 555-1234"        │
│                                                                  │
│  Using Placeholder Map:                                         │
│  • [LDB_EMAIL1] → john@example.com                             │
│  • [LDB_PHONE1] → 555-1234                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Display AI Response                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🤖 AI Assistant                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ I can help! I'll send information to john@example.com    │ │
│  │ and call you at 555-1234                                  │ │
│  │                                                            │ │
│  │ [With Your Info ✓] [Protected Version]                   │ │
│  │                                                            │ │
│  │ [📋 Copy] [🤖 Ask Again] [🗑️ Delete]                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                         KEY FEATURES
═══════════════════════════════════════════════════════════════════

🔒 SECURITY:
   • AI never sees real PII
   • Only placeholders sent to API
   • PII stays in your browser

🔄 TRANSPARENCY:
   • See both protected & restored versions
   • Toggle between views anytime
   • Know exactly what AI received

✨ SEAMLESS:
   • One-click AI integration
   • Auto-restore PII in responses
   • Continue conversations easily

═══════════════════════════════════════════════════════════════════
                      CONVERSATION EXAMPLE
═══════════════════════════════════════════════════════════════════

YOU:  "Hi, I'm Sarah at sarah@company.com"
      ↓ (protected)
AI:   "Hi, I'm [LDB_CUSTOM1] at [LDB_EMAIL1]"
      ↓ (AI responds)
AI:   "Hello [LDB_CUSTOM1]! I'll email [LDB_EMAIL1]"
      ↓ (restored)
YOU:  "Hello Sarah! I'll email sarah@company.com"

═══════════════════════════════════════════════════════════════════
