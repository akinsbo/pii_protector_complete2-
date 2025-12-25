/**
 * @fileoverview Plugin Manager for Ledebe Protector
 */

import { Plugin, LLMPlugin } from './types';
import { ChatGPTPlugin } from './ChatGPTPlugin';

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private settings = new Map<string, Record<string, any>>();

  constructor() {
    this.loadBuiltinPlugins();
  }

  loadBuiltinPlugins(): void {
    const chatgptPlugin = new ChatGPTPlugin();
    this.plugins.set(chatgptPlugin.id, chatgptPlugin);
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getLLMPlugin(id: string): LLMPlugin | undefined {
    const plugin = this.plugins.get(id);
    return plugin?.type === 'llm' ? plugin as LLMPlugin : undefined;
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getLLMPlugins(): LLMPlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.type === 'llm') as LLMPlugin[];
  }

  async installPlugin(pluginData: any): Promise<void> {
    // In a real implementation, this would download and validate the plugin
    // For now, we'll just register built-in plugins
    throw new Error('Plugin installation not implemented yet');
  }

  uninstallPlugin(id: string): void {
    this.plugins.delete(id);
    this.settings.delete(id);
  }

  getPluginSettings(pluginId: string): Record<string, any> {
    return this.settings.get(pluginId) || {};
  }

  setPluginSettings(pluginId: string, settings: Record<string, any>): void {
    this.settings.set(pluginId, settings);
    this.saveSettings();
  }

  private saveSettings(): void {
    // Save to localStorage or file system
    if (typeof window !== 'undefined') {
      localStorage.setItem('ledebe-plugin-settings', JSON.stringify(Object.fromEntries(this.settings)));
    }
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ledebe-plugin-settings');
      if (saved) {
        const data = JSON.parse(saved);
        this.settings = new Map(Object.entries(data));
      }
    }
  }

  async getMarketplacePlugins(): Promise<Plugin[]> {
    // Mock marketplace data - in real implementation, fetch from server
    return [
      {
        id: 'claude-plugin',
        name: 'Claude Integration',
        version: '1.0.0',
        description: 'Anthropic Claude AI integration with PII protection',
        author: 'Ledebe',
        type: 'llm',
        manifest: {
          permissions: ['network'],
          settings: [
            { key: 'apiKey', label: 'Anthropic API Key', type: 'password', required: true }
          ],
          capabilities: ['chat', 'pii-protection']
        }
      },
      {
        id: 'gemini-plugin',
        name: 'Google Gemini',
        version: '1.0.0',
        description: 'Google Gemini AI integration with PII protection',
        author: 'Ledebe',
        type: 'llm',
        manifest: {
          permissions: ['network'],
          settings: [
            { key: 'apiKey', label: 'Google AI API Key', type: 'password', required: true }
          ],
          capabilities: ['chat', 'pii-protection']
        }
      }
    ];
  }
}