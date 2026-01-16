/**
 * @fileoverview Chat Interface Component for Ledebe Protector
 */

import { PluginManager } from './PluginManager';
import { ChatManager } from './ChatManager';
import { LLMPlugin, ChatConversation, ChatFolder } from './types';

// API key URLs for different providers
const API_KEY_URLS = {
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  claude: 'https://console.anthropic.com/account/keys'
} as const;

// Default model configurations
const DEFAULT_MODELS = {
  fallback: process.env.DEFAULT_AI_MODEL || 'gpt-3.5-turbo'
} as const;

// Input type constants
const INPUT_TYPES = {
  password: 'password',
  text: 'text'
} as const;

export class ChatInterface {
  private pluginManager = new PluginManager();
  private chatManager = new ChatManager();
  private currentConversation: ChatConversation | null = null;
  private currentPlugin: LLMPlugin | null = null;
  private saveButtonListenerAdded = false;

  constructor() {
    this.initializeInterface();
    this.clearDuplicateQuickChats();
  }

  private clearDuplicateQuickChats(): void {
    // Clear localStorage to remove old Quick Chat duplicates
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ledebe-chat-data');
    }
  }

  private initializeInterface(): void {
    this.createChatUI();
    this.loadPlugins();
    this.loadConversations();
  }

  private createChatUI(): void {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-interface';
    chatContainer.innerHTML = `
      <div class="chat-sidebar">
        <div class="plugin-selector">
          <select id="plugin-select">
            <option value="">Select AI Plugin</option>
          </select>
          <button id="plugin-settings" title="Set up your API key here (Step 1)">⚙️</button>
        </div>
        
        <div class="conversation-controls">
          <button id="new-chat" title="Start a new conversation">+ New Chat</button>
          <button id="new-folder" title="Organize chats in folders">📁 New Folder</button>
        </div>
        
        <div class="conversations-list" id="conversations-list">
          <!-- Conversations will be loaded here -->
        </div>
        
        <div class="sidebar-footer">
          <div class="protection-toggle">
            <label class="toggle">
              <input id="chat-protect" type="checkbox" checked>
              <span class="slider"></span>
            </label>
            <span title="When ON: Your personal info is automatically hidden from AI. When OFF: Messages sent as-is.">PII Protection</span>
            <span id="chat-shield" title="Your personal info is protected!">🛡️</span>
          </div>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-header">
          <h3 id="chat-title">AI Chat - Protected & Private</h3>
          <div class="chat-controls">
            <select id="model-select" title="Choose AI model" style="display: none;">
              <option value="">Select Model</option>
            </select>
            <button id="export-chat" title="Download conversation" style="display: none;">Export</button>
            <button id="close-chat" title="Close AI Chat">✕</button>
          </div>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          <div class="welcome-message" style="text-align: center; padding: 40px; color: #7f8c8d; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">🛡️ Welcome to Protected AI Chat!</h2>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <h3 style="color: #2c3e50; margin-top: 0;">🚀 Quick Setup (2 minutes):</h3>
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #27ae60;"><strong>Step 1:</strong> Click the ⚙️ settings button on the left</div>
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #3498db;"><strong>Step 2:</strong> Click "Get your API key" to get a free key from OpenAI</div>
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #f39c12;"><strong>Step 3:</strong> Paste your API key and close settings</div>
              <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #9b59b6;"><strong>Step 4:</strong> Start chatting! Your personal info is automatically protected</div>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <strong>💡 Pro Tip:</strong> Your conversations stay on your computer. Personal info (names, emails, etc.) is hidden from AI before sending.
            </div>
            <p style="color: #7f8c8d; font-size: 0.9rem;">Hover over any button for helpful tips!</p>
          </div>
        </div>
        
        <div class="chat-input-container">
          <textarea id="chat-input" placeholder="Type your message... Your personal info will be automatically protected!" disabled title="Messages are automatically protected - names, emails, and phone numbers are hidden from AI"></textarea>
          <button id="send-button" title="Send protected message to AI" disabled>Send</button>
        </div>
      </div>
      
      <div id="plugin-settings-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>🔧 AI Plugin Settings</h2>
          <div id="plugin-settings-form"></div>
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; color: #6c757d; font-size: 0.9rem;">
            ✅ Settings auto-save as you type<br>
            🔑 Need help? Click the blue "Get your API key" link above<br>
            ✕ Use the × button to close when done
          </div>
        </div>
      </div>
    `;

    chatContainer.style.display = 'none';
    document.body.appendChild(chatContainer);
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const pluginSelect = document.getElementById('plugin-select') as HTMLSelectElement;
    const pluginSettings = document.getElementById('plugin-settings') as HTMLButtonElement;
    const newChatBtn = document.getElementById('new-chat') as HTMLButtonElement;
    const newFolderBtn = document.getElementById('new-folder') as HTMLButtonElement;
    const sendBtn = document.getElementById('send-button') as HTMLButtonElement;
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
    const exportBtn = document.getElementById('export-chat') as HTMLButtonElement;
    const closeBtn = document.getElementById('close-chat') as HTMLButtonElement;

    pluginSelect.addEventListener('change', (e) => {
      const pluginId = (e.target as HTMLSelectElement).value;
      this.selectPlugin(pluginId);
    });

    pluginSettings.addEventListener('click', () => {
      this.showPluginSettings();
    });

    newChatBtn.addEventListener('click', () => {
      this.createNewChat();
    });

    newFolderBtn.addEventListener('click', () => {
      this.createNewFolder();
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    modelSelect.addEventListener('change', (e) => {
      const model = (e.target as HTMLSelectElement).value;
      if (this.currentConversation) {
        this.currentConversation.model = model;
      }
    });

    exportBtn.addEventListener('click', () => {
      this.exportCurrentConversation();
    });

    closeBtn.addEventListener('click', () => {
      this.closeChatInterface();
    });

    // Modal close handlers
    const modal = document.getElementById('plugin-settings-modal');
    const modalCloseBtn = modal?.querySelector('.close');
    modalCloseBtn?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  private loadPlugins(): void {
    const pluginSelect = document.getElementById('plugin-select') as HTMLSelectElement;
    const llmPlugins = this.pluginManager.getLLMPlugins();
    
    llmPlugins.forEach((plugin, index) => {
      const option = document.createElement('option');
      option.value = plugin.id;
      option.textContent = plugin.name;
      pluginSelect.appendChild(option);
      
      // Auto-select first plugin
      if (index === 0) {
        pluginSelect.value = plugin.id;
        this.selectPlugin(plugin.id);
      }
    });
  }

  private selectPlugin(pluginId: string): void {
    if (!pluginId) {
      this.currentPlugin = null;
      this.updateUI();
      return;
    }

    this.currentPlugin = this.pluginManager.getLLMPlugin(pluginId) || null;
    this.updateUI();
    this.loadModels();
  }

  private loadModels(): void {
    const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    
    if (this.currentPlugin) {
      this.currentPlugin.getModels().forEach((model, index) => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} - ${model.description}`;
        modelSelect.appendChild(option);
        
        // Auto-select first model (usually GPT-4)
        if (index === 0) {
          modelSelect.value = model.id;
        }
      });
      modelSelect.style.display = 'block';
    } else {
      modelSelect.style.display = 'none';
    }
  }

  private createNewChat(): void {
    if (!this.currentPlugin) {
      alert('Please select an AI plugin first');
      return;
    }

    const model = (document.getElementById('model-select') as HTMLSelectElement).value;
    
    if (!model) {
      alert('Please select a model first');
      return;
    }

    // Create conversation with temporary title
    this.currentConversation = this.chatManager.createConversation('New Chat', model);
    
    // Clear welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    // Update placeholder text
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.placeholder = 'Type your message... (PII will be automatically protected)';
    }
    
    this.loadConversations();
    this.updateUI();
  }

  private createNewFolder(): void {
    const name = prompt('Enter folder name:');
    if (name) {
      this.chatManager.createFolder(name);
      this.loadConversations();
    }
  }

  private async sendMessage(): Promise<void> {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const message = chatInput.value.trim();
    
    if (!message || !this.currentPlugin) return;

    // Auto-create conversation if none exists
    if (!this.currentConversation) {
      const model = (document.getElementById('model-select') as HTMLSelectElement).value;
      if (!model) {
        alert('Please select a model first');
        return;
      }
      this.currentConversation = this.chatManager.createConversation('New Chat', model);
      
      // Clear welcome message
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage) {
        welcomeMessage.remove();
      }
    }

    // Add user message
    const userMessage = this.chatManager.addMessage(this.currentConversation.id, message, 'user');
    this.displayMessage(message, 'user', userMessage.id);
    chatInput.value = '';
    this.loadConversations(); // Refresh sidebar

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get plugin settings
      const settings = this.pluginManager.getPluginSettings(this.currentPlugin.id);
      
      // Send to AI (with PII protection handled in plugin)
      const response = await this.currentPlugin.chat(message, settings);
      
      // Add AI response
      const aiMessage = this.chatManager.addMessage(this.currentConversation.id, response, 'assistant');
      this.displayMessage(response, 'assistant', aiMessage.id);
      this.loadConversations(); // Refresh sidebar
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('401') || errorMsg.includes('API key') || errorMsg.includes('Unauthorized')) {
        const pluginName = this.currentPlugin?.name.toLowerCase() || '';
        let apiKeyUrl: string = API_KEY_URLS.openai;
        let buttonText = '🔑 Get OpenAI API Key';
        
        if (pluginName.includes('gemini') || pluginName.includes('google')) {
          apiKeyUrl = API_KEY_URLS.gemini;
          buttonText = '💎 Get Gemini API Key';
        } else if (pluginName.includes('claude') || pluginName.includes('anthropic')) {
          apiKeyUrl = API_KEY_URLS.claude;
          buttonText = '🤖 Get Claude API Key';
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `
          <div class="message-content">
            ❌ API Key Required<br><br>
            <button style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin: 5px;">
              ${buttonText}
            </button><br><br>
            Then click the ⚙️ button to configure your API key.
          </div>
          <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        const apiBtn = errorDiv.querySelector('button');
        apiBtn?.addEventListener('click', () => {
          // Ensure HTTPS for security
          const secureUrl = apiKeyUrl.startsWith('http://') ? apiKeyUrl.replace('http://', 'https://') : apiKeyUrl;
          // @ts-ignore
          if (window.electronAPI?.openExternal) {
            // @ts-ignore
            window.electronAPI.openExternal(secureUrl);
          } else {
            window.open(secureUrl, '_blank');
          }
        });
        
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
          messagesContainer.appendChild(errorDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      } else {
        this.displayMessage(`Error: ${errorMsg}`, 'error');
      }
    } finally {
      this.hideTypingIndicator();
    }
  }

  private displayMessage(content: string, role: 'user' | 'assistant' | 'error', messageId?: string): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (messageId) messageDiv.dataset.messageId = messageId;
    
    const actionsHtml = role === 'user' ? `
      <div class="message-actions">
        <button class="edit-btn" title="Edit message">✏️</button>
        <button class="delete-btn" title="Delete message">🗑️</button>
      </div>
    ` : '';
    
    messageDiv.innerHTML = `
      <div class="message-content">${this.formatMessage(content)}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
      ${actionsHtml}
    `;
    
    // Add event listeners for edit/delete
    if (role === 'user' && messageId) {
      const editBtn = messageDiv.querySelector('.edit-btn');
      const deleteBtn = messageDiv.querySelector('.delete-btn');
      
      editBtn?.addEventListener('click', () => this.editMessage(messageId, content));
      deleteBtn?.addEventListener('click', () => this.deleteMessage(messageId));
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private formatMessage(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private showTypingIndicator(): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message assistant typing';
    typingDiv.innerHTML = '<div class="message-content">AI is typing...</div>';
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private hideTypingIndicator(): void {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  private loadConversations(): void {
    const conversationsList = document.getElementById('conversations-list');
    if (!conversationsList) return;

    conversationsList.innerHTML = '';
    
    const folders = this.chatManager.getAllFolders();
    const conversations = this.chatManager.getAllConversations();

    // Add folders
    folders.forEach(folder => {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder';
      folderDiv.innerHTML = `
        <div class="folder-header">📁 ${folder.name}</div>
        <div class="folder-conversations"></div>
      `;
      conversationsList.appendChild(folderDiv);

      const folderConversations = this.chatManager.getConversationsByFolder(folder.id);
      const folderConversationsDiv = folderDiv.querySelector('.folder-conversations');
      
      folderConversations.forEach(conv => {
        this.addConversationToList(conv, folderConversationsDiv as HTMLElement);
      });
    });

    // Add conversations without folders
    const unfoldered = this.chatManager.getConversationsByFolder(undefined);
    unfoldered.forEach(conv => {
      this.addConversationToList(conv, conversationsList);
    });
  }

  private addConversationToList(conversation: ChatConversation, container: HTMLElement): void {
    const convDiv = document.createElement('div');
    convDiv.className = 'conversation-item';
    convDiv.dataset.conversationId = conversation.id;
    if (this.currentConversation?.id === conversation.id) {
      convDiv.classList.add('active');
    }
    convDiv.style.cursor = 'pointer';
    convDiv.style.userSelect = 'none';
    convDiv.setAttribute('role', 'button');
    convDiv.setAttribute('tabindex', '0');
    convDiv.innerHTML = `
      <div class="conversation-title">${conversation.title}</div>
      <div class="conversation-meta">${conversation.model} • ${conversation.messages.length} messages</div>
    `;
    
    const clickHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Conversation clicked:', conversation.title);
      // Remove active class from all items
      document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
      // Add active class to clicked item
      convDiv.classList.add('active');
      this.selectConversation(conversation);
    };
    
    convDiv.addEventListener('click', clickHandler);
    convDiv.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        clickHandler(e);
      }
    });
    
    container.appendChild(convDiv);
  }

  private selectConversation(conversation: ChatConversation): void {
    this.currentConversation = conversation;
    
    // Clear welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    // Update placeholder text
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.placeholder = 'Type your message... (PII will be automatically protected)';
    }
    
    this.updateUI();
    this.loadMessages();
  }

  private loadMessages(): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer || !this.currentConversation) return;

    messagesContainer.innerHTML = '';
    
    this.currentConversation.messages.forEach(message => {
      // Display original content for user messages, regular content for AI
      const content = message.role === 'user' && message.originalContent 
        ? message.originalContent 
        : message.content;
      const role = message.role === 'system' ? 'assistant' : message.role;
      this.displayMessage(content, role, message.id);
    });
  }

  private updateUI(): void {
    const chatTitle = document.getElementById('chat-title');
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendButton = document.getElementById('send-button') as HTMLButtonElement;
    const exportBtn = document.getElementById('export-chat') as HTMLButtonElement;

    if (this.currentPlugin) {
      if (chatTitle) chatTitle.textContent = this.currentConversation?.title || 'Ready to chat safely!';
      chatInput.disabled = false;
      chatInput.placeholder = 'Type your message... Your personal info is automatically protected!';
      sendButton.disabled = false;
      exportBtn.style.display = this.currentConversation ? 'block' : 'none';
    } else {
      if (chatTitle) chatTitle.textContent = 'AI Chat - Protected & Private';
      chatInput.disabled = true;
      chatInput.placeholder = 'Select an AI plugin above to start chatting...';
      sendButton.disabled = true;
      exportBtn.style.display = 'none';
    }
  }

  private showPluginSettings(): void {
    if (!this.currentPlugin) {
      alert('Please select a plugin first');
      return;
    }

    const modal = document.getElementById('plugin-settings-modal');
    const form = document.getElementById('plugin-settings-form');
    
    if (!modal || !form) return;

    // Prevent opening if already open
    if (modal.style.display === 'block') {
      console.log('🚫 Modal already open, ignoring');
      return;
    }

    const currentSettings = this.pluginManager.getPluginSettings(this.currentPlugin.id);
    
    form.innerHTML = '';
    this.currentPlugin.manifest.settings.forEach(setting => {
      const div = document.createElement('div');
      div.className = 'setting-item';
      
      const label = document.createElement('label');
      label.textContent = setting.label;
      
      let input: HTMLInputElement | HTMLSelectElement;
      
      if (setting.type === 'select') {
        input = document.createElement('select');
        setting.options?.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option;
          optionEl.textContent = option;
          input.appendChild(optionEl);
        });
      } else {
        input = document.createElement('input');
        input.type = setting.type === INPUT_TYPES.password ? INPUT_TYPES.password : INPUT_TYPES.text;
      }
      
      input.id = `setting-${setting.key}`;
      input.value = currentSettings[setting.key] || setting.default || '';
      
      // Auto-save when API key input changes
      if (setting.key === 'apiKey') {
        input.addEventListener('input', () => {
          setTimeout(() => this.savePluginSettings(), 500);
        });
      }
      
      // Auto-save when model changes and ensure gpt-3.5-turbo for compatibility
      if (setting.key === 'model') {
        input.addEventListener('change', () => {
          const selectedModel = (input as HTMLSelectElement).value;
          if (selectedModel === 'gpt-4') {
            // Show warning about GPT-4 requirements
            const warning = document.createElement('div');
            warning.style.color = '#f59e0b';
            warning.style.fontSize = '0.8rem';
            warning.style.marginTop = '0.25rem';
            warning.textContent = '⚠️ GPT-4 requires a paid OpenAI account. If you get access errors, switch to GPT-3.5-turbo.';
            input.parentElement?.appendChild(warning);
          }
          this.savePluginSettings();
        });
      }
      
      div.appendChild(label);
      div.appendChild(input);
      
      if (setting.key === 'apiKey') {
        const info = document.createElement('div');
        info.style.fontSize = '0.85rem';
        info.style.color = '#6b7280';
        info.style.marginTop = '0.5rem';
        info.style.lineHeight = '1.4';
        
        const link = document.createElement('button');
        link.style.background = 'none';
        link.style.border = 'none';
        link.style.color = '#3498db';
        link.style.textDecoration = 'underline';
        link.style.cursor = 'pointer';
        link.style.fontSize = '0.85rem';
        link.style.fontWeight = '500';
        link.textContent = '🔑 Get your API key from OpenAI →';
        
        link.addEventListener('click', () => {
          // Ensure HTTPS for security
          const secureUrl = API_KEY_URLS.openai.startsWith('http://') ? API_KEY_URLS.openai.replace('http://', 'https://') : API_KEY_URLS.openai;
          // @ts-ignore
          if (window.electronAPI?.openExternal) {
            // @ts-ignore
            window.electronAPI.openExternal(secureUrl);
          } else {
            window.open(secureUrl, '_blank');
          }
        });
        
        info.appendChild(link);
        const instructions = document.createElement('div');
        instructions.style.marginTop = '0.25rem';
        instructions.style.fontSize = '0.8rem';
        instructions.textContent = 'Click to open OpenAI dashboard, create key, then paste it above';
        info.appendChild(instructions);
        
        div.appendChild(info);
      } else if (setting.key === 'model') {
        const info = document.createElement('div');
        info.style.fontSize = '0.8rem';
        info.style.color = '#6b7280';
        info.style.marginTop = '0.25rem';
        info.textContent = 'GPT-4 is more capable but costs more. GPT-3.5 is faster and cheaper.';
        div.appendChild(info);
      } else if (setting.key === 'temperature') {
        const info = document.createElement('div');
        info.style.fontSize = '0.8rem';
        info.style.color = '#6b7280';
        info.style.marginTop = '0.25rem';
        info.textContent = 'Lower values (0.1-0.3) for focused responses, higher (0.7-1.0) for creative ones';
        div.appendChild(info);
      } else if (setting.key === 'maxTokens') {
        const info = document.createElement('div');
        info.style.fontSize = '0.8rem';
        info.style.color = '#6b7280';
        info.style.marginTop = '0.25rem';
        info.textContent = 'Maximum response length. Higher values allow longer responses but cost more.';
        div.appendChild(info);
      }
      form.appendChild(div);
    });

    modal.style.display = 'block';


  }

  private savePluginSettings(): void {
    if (!this.currentPlugin) return;

    const settings: Record<string, any> = {};
    
    this.currentPlugin.manifest.settings.forEach(setting => {
      const input = document.getElementById(`setting-${setting.key}`) as HTMLInputElement;
      if (input) {
        settings[setting.key] = input.value;
      }
    });

    this.pluginManager.setPluginSettings(this.currentPlugin.id, settings);
  }

  private exportCurrentConversation(): void {
    if (!this.currentConversation) return;

    try {
      const exportData = this.chatManager.exportConversation(this.currentConversation.id);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentConversation.title}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private createDefaultConversation(): void {
    if (!this.currentPlugin || this.currentConversation) return;
    
    // Check if a "Quick Chat" conversation already exists
    const existingQuickChat = this.chatManager.getAllConversations()
      .find(conv => conv.title === 'Quick Chat');
    
    if (existingQuickChat) {
      this.currentConversation = existingQuickChat;
      this.updateUI();
      return;
    }
    
    const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
    let model = modelSelect.value;
    
    // Ensure we use gpt-3.5-turbo as fallback if no model selected or gpt-4 is selected without access
    if (!model || model === 'gpt-4') {
      model = DEFAULT_MODELS.fallback;
      modelSelect.value = model; // Update the UI to reflect the change
    }
    
    if (model) {
      this.currentConversation = this.chatManager.createConversation('Quick Chat', model);
      
      // Clear welcome message
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage) {
        welcomeMessage.remove();
      }
      
      // Update placeholder text
      const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
      if (chatInput) {
        chatInput.placeholder = 'Type your message... (PII will be automatically protected)';
      }
      
      this.loadConversations();
      this.updateUI();
    }
  }

  private closeChatInterface(): void {
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface) {
      chatInterface.style.display = 'none';
    }
  }

  private editMessage(messageId: string, currentContent: string): void {
    if (!this.currentConversation) return;
    
    const newContent = prompt('Edit your message:', currentContent);
    if (!newContent || newContent === currentContent) return;
    
    // Find and update the message
    const message = this.currentConversation.messages.find(m => m.id === messageId);
    if (message) {
      message.originalContent = newContent;
      const maskResult = new (require('../pii/Anonymizer').Anonymizer)().mask(newContent);
      message.content = maskResult.maskedText;
      message.maskedContent = maskResult.maskedText;
      
      this.chatManager.saveData();
      this.loadMessages();
    }
  }

  private deleteMessage(messageId: string): void {
    if (!this.currentConversation) return;
    
    if (!confirm('Delete this message?')) return;
    
    // Remove message and all subsequent messages
    const messageIndex = this.currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      this.currentConversation.messages.splice(messageIndex);
      this.chatManager.saveData();
      this.loadMessages();
      this.loadConversations(); // Refresh sidebar
    }
  }
}