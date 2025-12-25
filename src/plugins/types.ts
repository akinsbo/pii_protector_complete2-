/**
 * @fileoverview Plugin system types for Ledebe Protector
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'llm' | 'utility' | 'integration';
  manifest: PluginManifest;
}

export interface PluginManifest {
  permissions: string[];
  settings: PluginSetting[];
  capabilities: string[];
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  default?: any;
}

export interface LLMPlugin extends Plugin {
  type: 'llm';
  models: LLMModel[];
  chat(message: string, settings: Record<string, any>): Promise<string>;
  getModels(): LLMModel[];
}

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1kTokens?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  maskedContent?: string;
  originalContent?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  folderId?: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
}