// AI Chat Integration for Ledebe Protector
// Minimal implementation for OpenAI, Anthropic, and Google AI

class AIChat {
    constructor() {
        this.provider = localStorage.getItem('aiProvider') || 'openai';
        this.apiKey = localStorage.getItem('aiKey') || '';
        this.enabled = localStorage.getItem('aiEnabled') === 'true';
        this.conversationHistory = []; // Track conversation context
        console.log('AIChat initialized:', { provider: this.provider, enabled: this.enabled, hasKey: !!this.apiKey });
    }

    isConfigured() {
        const configured = this.enabled && this.apiKey && this.apiKey.length > 0;
        console.log('AI isConfigured:', configured, { enabled: this.enabled, hasKey: !!this.apiKey });
        return configured;
    }

    async sendMessage(protectedText, placeholderMap, useContext = true) {
        console.log('AI sendMessage called:', { textLength: protectedText.length, hasPlaceholders: !!placeholderMap });
        
        if (!this.isConfigured()) {
            const error = 'AI not configured. Please add your API key in Settings.';
            console.error(error);
            throw new Error(error);
        }

        try {
            // Add user message to history
            if (useContext) {
                this.conversationHistory.push({ role: 'user', content: protectedText });
            }

            let response;
            switch (this.provider) {
                case 'openai':
                    response = await this.sendToOpenAI(protectedText, useContext);
                    break;
                case 'anthropic':
                    response = await this.sendToAnthropic(protectedText, useContext);
                    break;
                case 'google':
                    response = await this.sendToGoogle(protectedText, useContext);
                    break;
                default:
                    throw new Error('Unknown AI provider');
            }

            // Add AI response to history
            if (useContext) {
                this.conversationHistory.push({ role: 'assistant', content: response });
            }

            // Restore PII in response
            let restoredResponse = response;
            for (const [placeholder, original] of Object.entries(placeholderMap)) {
                const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                restoredResponse = restoredResponse.replace(regex, original);
            }

            return {
                protected: response,
                restored: restoredResponse
            };
        } catch (error) {
            console.error('AI Error Details:', {
                message: error.message,
                stack: error.stack,
                provider: this.provider
            });
            throw error;
        }
    }

    clearConversation() {
        this.conversationHistory = [];
    }

    async sendToOpenAI(message, useContext) {
        const messages = useContext && this.conversationHistory.length > 0 
            ? this.conversationHistory 
            : [{ role: 'user', content: message }];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: messages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async sendToAnthropic(message, useContext) {
        const messages = useContext && this.conversationHistory.length > 0
            ? this.conversationHistory
            : [{ role: 'user', content: message }];

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1024,
                messages: messages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Anthropic API error');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async sendToGoogle(message, useContext) {
        // Google uses different format - convert conversation history
        let contents;
        if (useContext && this.conversationHistory.length > 0) {
            contents = this.conversationHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));
        } else {
            contents = [{ parts: [{ text: message }] }];
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Google AI API error');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

// Export for use in main app
window.AIChat = AIChat;
