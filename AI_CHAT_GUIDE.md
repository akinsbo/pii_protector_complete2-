# AI Chat Integration - Quick Implementation Guide

## What Was Added

1. **ai-chat.js** - A minimal AI integration module supporting:
   - OpenAI (ChatGPT)
   - Anthropic (Claude)
   - Google (Gemini)

## How to Add "Ask AI" Button to Messages

Add this button to the message actions in `addMessageToChat()` function:

```javascript
<button class=\"message-action-btn\" data-label=\"Ask AI\" onclick=\"askAI('${messageId}')\">🤖</button>
```

## Add the askAI Function

Add this function to your JavaScript:

```javascript
// Initialize AI Chat
const aiChat = new AIChat();

// Ask AI function
async function askAI(messageId) {
    const messageDiv = document.getElementById(messageId);
    if (!messageDiv) return;
    
    // Check if AI is configured
    if (!aiChat.isConfigured()) {
        showToast('⚠️ Please configure AI in Settings first', 'error');
        showSettings();
        return;
    }
    
    const protectedText = messageDiv.dataset.protectedText;
    const sendBtn = document.getElementById('send-btn');
    
    try {
        // Show loading
        sendBtn.disabled = true;
        sendBtn.textContent = '🤖 Asking AI...';
        showToast('🤖 Sending to AI...', 'success');
        
        // Send to AI
        const result = await aiChat.sendMessage(protectedText, placeholderMap);
        
        // Add AI response to chat
        addAIResponse(result.restored, result.protected);
        
        showToast('✅ AI responded!', 'success');
    } catch (error) {
        console.error('AI Error:', error);
        showToast('❌ AI Error: ' + error.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}

// Add AI response to chat
function addAIResponse(restoredText, protectedText) {
    const chatArea = document.getElementById('chat-area');
    const messageId = 'ai-msg-' + (++messageCounter);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message restore';
    messageDiv.id = messageId;
    
    messageDiv.innerHTML = `
        <div class="chat-message-inner">
            <div class="message-label">
                <span>🤖 AI Assistant</span>
            </div>
            <div class="message-content" style="border-color: var(--primary-blue);">
                <div class="message-text" data-view="restored">${escapeHtml(restoredText)}</div>
                <div class="message-tabs">
                    <button class="message-tab active" onclick="switchAIView('${messageId}', 'restored')">With Your Info</button>
                    <button class="message-tab" onclick="switchAIView('${messageId}', 'protected')">Protected Version</button>
                </div>
                <div class="message-actions">
                    <button class="message-action-btn" data-label="Copy" onclick="copyMessage('${messageId}')">📋</button>
                    <button class="message-action-btn" data-label="Delete" onclick="deleteMessage('${messageId}')">🗑️</button>
                </div>
            </div>
        </div>
    `;
    
    messageDiv.dataset.originalText = restoredText;
    messageDiv.dataset.protectedText = protectedText;
    
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Switch AI response view
function switchAIView(messageId, view) {
    const messageDiv = document.getElementById(messageId);
    if (!messageDiv) return;
    
    const textDiv = messageDiv.querySelector('.message-text');
    const tabs = messageDiv.querySelectorAll('.message-tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (view === 'restored') {
        textDiv.textContent = messageDiv.dataset.originalText;
        textDiv.dataset.view = 'restored';
        tabs[0].classList.add('active');
    } else {
        textDiv.textContent = messageDiv.dataset.protectedText;
        textDiv.dataset.view = 'protected';
        tabs[1].classList.add('active');
    }
}
```

## Quick Test

1. Open Settings (⚙️)
2. Enable AI Chat Integration
3. Enter your API key
4. Save Settings
5. Type a message with PII (e.g., "My email is john@example.com")
6. Click Send
7. Click the 🤖 button on your message
8. AI will respond with your PII restored!

## Full Integration

To fully integrate, you need to:

1. Add the `<script src='ai-chat.js'></script>` to index.html ✅ (Already done)
2. Add the 🤖 button to message actions
3. Add the three functions above to your JavaScript
4. Test with your API key

## Example Usage

**You type:** "My email is john@example.com and I need help"
**AI sees:** "My email is [LDB_EMAIL1] and I need help"
**AI responds:** "I can help you with [LDB_EMAIL1]..."
**You see:** "I can help you with john@example.com..."

Your PII is protected when sent to AI, but restored in the response you see!
