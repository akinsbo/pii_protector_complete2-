// Multi-AI Chat Interface with Checkboxes
// Adds sidebar with ChatGPT, Claude, and Gemini selection

class MultiAIChat {
    constructor() {
        this.providers = {
            openai: { name: 'ChatGPT', enabled: false, apiKey: '' },
            claude: { name: 'Claude', enabled: false, apiKey: '' },
            gemini: { name: 'Gemini', enabled: false, apiKey: '' }
        };
        this.loadSettings();
        this.createUI();
        this.attachListeners();
        console.log('✅ Multi-AI Chat initialized');
    }

    loadSettings() {
        const saved = localStorage.getItem('multi-ai-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            Object.keys(this.providers).forEach(key => {
                if (settings[key]) {
                    this.providers[key] = { ...this.providers[key], ...settings[key] };
                }
            });
        }
    }

    saveSettings() {
        localStorage.setItem('multi-ai-settings', JSON.stringify(this.providers));
    }

    createUI() {
        const sidebar = document.createElement('div');
        sidebar.id = 'multi-ai-sidebar';
        sidebar.style.cssText = `
            position: fixed;
            right: -350px;
            top: 0;
            width: 350px;
            height: 100vh;
            background: #2c3e50;
            color: white;
            transition: right 0.3s;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            box-shadow: -2px 0 10px rgba(0,0,0,0.3);
        `;

        sidebar.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid #34495e;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">🤖 AI Chat</h3>
                    <button id="close-multi-ai" style="background: #e74c3c; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 18px;">✕</button>
                </div>
                
                <div style="background: #34495e; padding: 15px; border-radius: 8px;">
                    <button id="hello-test-btn" style="width: 100%; padding: 15px; background: #e74c3c; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 20px; font-weight: bold; margin-bottom: 15px;">👋 HELLO - CLICK ME!</button>
                    <h4 style="margin: 0 0 10px 0; font-size: 14px;">Select AI Models:</h4>
                    <div id="ai-checkboxes"></div>
                    <button id="configure-apis" style="width: 100%; margin-top: 10px; padding: 8px; background: #3498db; border: none; color: white; border-radius: 4px; cursor: pointer;">⚙️ Configure API Keys</button>
                </div>
            </div>
            
            <div id="chat-area" style="flex: 1; overflow-y: auto; padding: 20px;"></div>
            
            <div style="padding: 15px; border-top: 1px solid #34495e;">
                <textarea id="multi-ai-input" placeholder="Type your message..." style="width: 100%; padding: 10px; border: 1px solid #34495e; border-radius: 4px; resize: none; height: 60px; font-family: inherit;"></textarea>
                <button id="send-multi-ai" style="width: 100%; margin-top: 10px; padding: 10px; background: #27ae60; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">Send to Selected AIs</button>
            </div>
        `;

        document.body.appendChild(sidebar);
        this.renderCheckboxes();
    }

    renderCheckboxes() {
        const container = document.getElementById('ai-checkboxes');
        container.innerHTML = '';

        Object.entries(this.providers).forEach(([key, provider]) => {
            const hasKey = provider.apiKey && provider.apiKey.length > 0;
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: #2c3e50; border-radius: 4px; margin-bottom: 8px;';
            
            div.innerHTML = `
                <input type="checkbox" id="cb-${key}" ${provider.enabled ? 'checked' : ''} ${!hasKey ? 'disabled' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                <label for="cb-${key}" style="flex: 1; cursor: pointer; font-size: 14px;">${provider.name}</label>
                <span style="font-size: 16px;">${hasKey ? '✅' : '⚠️'}</span>
            `;
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.providers[key].enabled = checkbox.checked;
                this.saveSettings();
            });
            
            container.appendChild(div);
        });
    }

    attachListeners() {
        // Hello test button
        document.getElementById('hello-test-btn').addEventListener('click', () => {
            alert('🎉 HELLO! The sidebar is working! You can see me!');
        });
        
        // Toggle sidebar
        document.addEventListener('open-ai-chat', () => this.show());
        
        const aiChatBtn = document.getElementById('ai-chat-btn');
        if (aiChatBtn) {
            aiChatBtn.addEventListener('click', () => this.show());
        }

        // Close button
        document.getElementById('close-multi-ai').addEventListener('click', () => this.hide());

        // Configure button
        document.getElementById('configure-apis').addEventListener('click', () => this.showConfigModal());

        // Send button
        document.getElementById('send-multi-ai').addEventListener('click', () => this.sendToAIs());
    }

    show() {
        document.getElementById('multi-ai-sidebar').style.right = '0';
    }

    hide() {
        document.getElementById('multi-ai-sidebar').style.right = '-350px';
    }

    showConfigModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        let html = '<h2 style="margin-top: 0;">🔧 Configure API Keys</h2>';
        
        Object.entries(this.providers).forEach(([key, provider]) => {
            const links = {
                openai: 'https://platform.openai.com/api-keys',
                claude: 'https://console.anthropic.com/account/keys',
                gemini: 'https://aistudio.google.com/app/apikey'
            };
            
            html += `
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">${provider.name}</label>
                    <input type="password" id="key-${key}" value="${provider.apiKey}" placeholder="Enter API key" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px;">
                    <a href="${links[key]}" target="_blank" style="color: #3498db; font-size: 13px;">🔑 Get your ${provider.name} API key →</a>
                </div>
            `;
        });

        html += `
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="save-keys" style="flex: 1; padding: 12px; background: #27ae60; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">Save</button>
                <button id="cancel-keys" style="flex: 1; padding: 12px; background: #95a5a6; border: none; color: white; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
        `;

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('save-keys').addEventListener('click', () => {
            Object.keys(this.providers).forEach(key => {
                const input = document.getElementById(`key-${key}`);
                this.providers[key].apiKey = input.value;
            });
            this.saveSettings();
            this.renderCheckboxes();
            modal.remove();
            alert('✅ API keys saved!');
        });

        document.getElementById('cancel-keys').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async sendToAIs() {
        const input = document.getElementById('multi-ai-input');
        const rawMessage = input.value.trim();

        if (!rawMessage) return;

        // Apply PII masking before sending to any AI provider
        const placeholderMap = {};
        const { masked: maskedMessage, count } = applyPIIMasking(rawMessage, placeholderMap);
        const hasProtections = count > 0;

        const enabled = Object.entries(this.providers).filter(([_, p]) => p.enabled && p.apiKey);

        if (enabled.length === 0) {
            alert('⚠️ Please enable at least one AI and configure its API key');
            return;
        }

        const chatArea = document.getElementById('chat-area');

        // Show the masked message (what is actually sent to AI)
        const userMsg = document.createElement('div');
        userMsg.style.cssText = 'background: #3498db; color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;';
        userMsg.innerHTML = hasProtections
            ? `<span style="font-size:11px;opacity:0.8;">🛡️ PII protected (${count} item${count > 1 ? 's' : ''} masked)</span><br>${maskedMessage}`
            : maskedMessage;
        chatArea.appendChild(userMsg);

        input.value = '';
        chatArea.scrollTop = chatArea.scrollHeight;

        // Send masked text to each enabled AI
        for (const [key, provider] of enabled) {
            const aiMsg = document.createElement('div');
            aiMsg.style.cssText = 'background: #ecf0f1; color: #2c3e50; padding: 10px; border-radius: 8px; margin-bottom: 10px;';
            aiMsg.innerHTML = `<strong>${provider.name}:</strong> <em>Thinking...</em>`;
            chatArea.appendChild(aiMsg);
            chatArea.scrollTop = chatArea.scrollHeight;

            try {
                const response = await this.callAI(key, maskedMessage, provider.apiKey);

                // Restore PII in the AI's response
                let restoredResponse = response;
                for (const [placeholder, original] of Object.entries(placeholderMap)) {
                    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    restoredResponse = restoredResponse.replace(regex, original);
                }

                aiMsg.innerHTML = `<strong>${provider.name}:</strong><br>${restoredResponse}`;
            } catch (error) {
                aiMsg.innerHTML = `<strong>${provider.name}:</strong><br><span style="color: #e74c3c;">❌ ${error.message}</span>`;
            }

            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }

    async callAI(provider, message, apiKey) {
        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: message }] })
            });
            if (!res.ok) throw new Error('OpenAI API error');
            const data = await res.json();
            return data.choices[0].message.content;
        }
        
        if (provider === 'claude') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: message }] })
            });
            if (!res.ok) throw new Error('Claude API error');
            const data = await res.json();
            return data.content[0].text;
        }
        
        if (provider === 'gemini') {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
            });
            if (!res.ok) throw new Error('Gemini API error');
            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MultiAIChat());
} else {
    new MultiAIChat();
}
