/**
 * @fileoverview Chat Manager for conversation handling with PII protection
 */

import { ChatMessage, ChatConversation, ChatFolder } from './types';
import { Anonymizer } from '../pii/Anonymizer';
import { analytics } from '../analytics';

export class ChatManager {
  private conversations = new Map<string, ChatConversation>();
  private folders = new Map<string, ChatFolder>();
  private anonymizer = new Anonymizer();

  constructor() {
    this.loadData();
  }

  createFolder(name: string, parentId?: string): ChatFolder {
    const folder: ChatFolder = {
      id: this.generateId(),
      name,
      parentId,
      createdAt: new Date()
    };
    this.folders.set(folder.id, folder);
    this.saveData();
    return folder;
  }

  createConversation(title: string, model: string, folderId?: string): ChatConversation {
    const conversation: ChatConversation = {
      id: this.generateId(),
      title,
      folderId,
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(conversation.id, conversation);
    // Don't save empty conversations to localStorage yet
    
    // Track conversation creation
    analytics.trackConversation('created', { model, has_folder: !!folderId });
    
    return conversation;
  }

  addMessage(conversationId: string, content: string, role: 'user' | 'assistant'): ChatMessage {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // For user messages, store both original and masked versions
    let maskedContent: string | undefined;
    let originalContent: string | undefined;
    
    if (role === 'user') {
      const maskResult = this.anonymizer.mask(content);
      maskedContent = maskResult.maskedText;
      originalContent = content;
      
      // Update conversation title based on first user message
      if (conversation.messages.length === 0) {
        const words = content.trim().split(/\s+/);
        const title = words.slice(0, 3).join(' ');
        conversation.title = title || 'New Chat';
      }
    }

    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content: role === 'user' ? maskedContent || content : content,
      timestamp: new Date(),
      maskedContent,
      originalContent
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    
    // Only save conversations that have messages
    this.saveData();
    return message;
  }

  getConversation(id: string): ChatConversation | undefined {
    return this.conversations.get(id);
  }

  getAllConversations(): ChatConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getConversationsByFolder(folderId?: string): ChatConversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.folderId === folderId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getAllFolders(): ChatFolder[] {
    return Array.from(this.folders.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  deleteConversation(id: string): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      analytics.trackConversation('deleted', { 
        model: conversation.model, 
        message_count: conversation.messages.length 
      });
    }
    this.conversations.delete(id);
    this.saveData();
  }

  deleteFolder(id: string): void {
    // Move conversations out of folder
    for (const conversation of this.conversations.values()) {
      if (conversation.folderId === id) {
        conversation.folderId = undefined;
      }
    }
    this.folders.delete(id);
    this.saveData();
  }

  updateConversationTitle(id: string, title: string): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      this.saveData();
    }
  }

  moveConversation(conversationId: string, folderId?: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.folderId = folderId;
      conversation.updatedAt = new Date();
      this.saveData();
    }
  }

  searchConversations(query: string): ChatConversation[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.conversations.values())
      .filter(c => 
        c.title.toLowerCase().includes(lowerQuery) ||
        c.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  exportConversation(id: string): string {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const data = {
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.originalContent || m.content, // Export original content
        timestamp: m.timestamp
      }))
    };

    // Track export
    analytics.trackConversation('exported', { 
      model: conversation.model, 
      message_count: conversation.messages.length 
    });

    return JSON.stringify(data, null, 2);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public saveData(): void {
    if (typeof window !== 'undefined') {
      const data = {
        conversations: Object.fromEntries(this.conversations),
        folders: Object.fromEntries(this.folders)
      };
      localStorage.setItem('ledebe-chat-data', JSON.stringify(data));
    }
  }

  private loadData(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ledebe-chat-data');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.conversations) {
          this.conversations = new Map();
          for (const [id, conv] of Object.entries(data.conversations)) {
            const conversation = conv as any;
            // Convert date strings back to Date objects
            conversation.createdAt = new Date(conversation.createdAt);
            conversation.updatedAt = new Date(conversation.updatedAt);
            if (conversation.messages) {
              conversation.messages.forEach((msg: any) => {
                msg.timestamp = new Date(msg.timestamp);
              });
            }
            this.conversations.set(id, conversation);
          }
        }
        if (data.folders) {
          this.folders = new Map();
          for (const [id, folder] of Object.entries(data.folders)) {
            const folderData = folder as any;
            folderData.createdAt = new Date(folderData.createdAt);
            this.folders.set(id, folderData);
          }
        }
      }
    }
  }
}