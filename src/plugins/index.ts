/**
 * @fileoverview Main Plugin System Integration for Ledebe Protector
 */

import { ChatInterface } from './ChatInterface';
import { PluginManager } from './PluginManager';
import { ChatManager } from './ChatManager';
import { analytics } from '../analytics';

export class PluginSystem {
  private chatInterface: ChatInterface;
  private pluginManager: PluginManager;
  private chatManager: ChatManager;

  constructor() {
    this.pluginManager = new PluginManager();
    this.chatManager = new ChatManager();
    this.chatInterface = new ChatInterface();
  }

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    try {
      // Load CSS
      this.loadStyles();
      
      // Initialize components
      await this.pluginManager.loadBuiltinPlugins();
      
      // Track initialization
      analytics.trackFeature('plugin_system_initialized');
      
      console.log('Plugin system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize plugin system:', error);
      analytics.trackError('plugin_system_init_failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Load the chat interface styles
   */
  private loadStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Chat Interface Styles */
      #chat-interface {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f5f5f5;
      }
      
      .chat-sidebar {
        width: 300px;
        background: #2c3e50;
        color: white;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #34495e;
      }
      
      .plugin-selector {
        padding: 15px;
        border-bottom: 1px solid #34495e;
        display: flex;
        gap: 10px;
      }
      
      .plugin-selector select {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: #34495e;
        color: white;
      }
      
      .plugin-selector button {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        background: #3498db;
        color: white;
        cursor: pointer;
      }
      
      .conversation-controls {
        padding: 15px;
        border-bottom: 1px solid #34495e;
        display: flex;
        gap: 10px;
      }
      
      .conversation-controls button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 4px;
        background: #27ae60;
        color: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .conversations-list {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }
      
      .sidebar-footer {
        padding: 15px;
        border-top: 1px solid #34495e;
      }
      
      .protection-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: white;
      }
      
      .conversation-item {
        padding: 12px;
        margin: 5px 0;
        background: #34495e;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .conversation-item:hover {
        background: #3498db;
      }
      
      .conversation-title {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .conversation-meta {
        font-size: 12px;
        color: #bdc3c7;
      }
      
      .chat-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: white;
      }
      
      .chat-header {
        padding: 15px 20px;
        border-bottom: 1px solid #ecf0f1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
      }
      
      .chat-header h3 {
        margin: 0;
        color: #2c3e50;
      }
      
      .chat-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .chat-controls select {
        padding: 6px 10px;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
      }
      
      .chat-controls button {
        padding: 6px 12px;
        border: 1px solid #3498db;
        border-radius: 4px;
        background: #3498db;
        color: white;
        cursor: pointer;
      }
      
      #close-chat {
        background: #e74c3c !important;
        border-color: #e74c3c !important;
        font-size: 16px;
        font-weight: bold;
        padding: 4px 8px !important;
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 12px;
      }
      
      .message.user {
        align-self: flex-end;
        background: #3498db;
        color: white;
      }
      
      .message.assistant {
        align-self: flex-start;
        background: #ecf0f1;
        color: #2c3e50;
      }
      
      .message.error {
        align-self: flex-start;
        background: #e74c3c;
        color: white;
      }
      
      .message-content {
        margin-bottom: 4px;
        line-height: 1.4;
      }
      
      .message-time {
        font-size: 11px;
        opacity: 0.7;
      }
      
      .chat-input-container {
        padding: 20px;
        border-top: 1px solid #ecf0f1;
        display: flex;
        gap: 10px;
        background: white;
      }
      
      .chat-input-container textarea {
        flex: 1;
        padding: 12px;
        border: 1px solid #bdc3c7;
        border-radius: 8px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        min-height: 20px;
        max-height: 100px;
      }
      
      .chat-input-container button {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        background: #3498db;
        color: white;
        cursor: pointer;
        font-weight: 500;
      }
      
      .chat-input-container button:disabled {
        background: #bdc3c7;
        cursor: not-allowed;
      }
      
      .modal {
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .modal-content {
        background-color: white;
        margin: 10% auto;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 500px;
        position: relative;
      }
      
      .close {
        position: absolute;
        right: 15px;
        top: 15px;
        font-size: 24px;
        cursor: pointer;
        color: #aaa;
      }
      
      .setting-item {
        margin-bottom: 15px;
      }
      
      .setting-item label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #2c3e50;
      }
      
      .setting-item input,
      .setting-item select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      #save-settings {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 4px;
        background: #27ae60;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get the plugin manager instance
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Get the chat manager instance
   */
  getChatManager(): ChatManager {
    return this.chatManager;
  }

  /**
   * Show the chat interface
   */
  showChatInterface(): void {
    const existingInterface = document.getElementById('chat-interface');
    if (existingInterface) {
      existingInterface.style.display = 'flex';
      analytics.trackFeature('chat_interface_opened');
    }
  }

  /**
   * Hide the chat interface
   */
  hideChatInterface(): void {
    const existingInterface = document.getElementById('chat-interface');
    if (existingInterface) {
      existingInterface.style.display = 'none';
    }
  }

  /**
   * Toggle the chat interface visibility
   */
  toggleChatInterface(): void {
    const existingInterface = document.getElementById('chat-interface');
    if (existingInterface) {
      const isVisible = existingInterface.style.display !== 'none';
      if (isVisible) {
        existingInterface.style.display = 'none';
        analytics.trackFeature('chat_interface_closed');
      } else {
        existingInterface.style.display = 'flex';
        analytics.trackFeature('chat_interface_opened');
      }
    }
  }
}

// Export singleton instance
export const pluginSystem = new PluginSystem();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    pluginSystem.initialize().catch(console.error);
  });
}

// Export all types and classes for external use
export * from './types';
export { PluginManager } from './PluginManager';
export { ChatManager } from './ChatManager';
export { ChatInterface } from './ChatInterface';
export { ChatGPTPlugin } from './ChatGPTPlugin';