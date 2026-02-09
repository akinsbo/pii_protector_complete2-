/**
 * @fileoverview Claude Plugin with PII protection for Ledebe Protector
 */

import { LLMPlugin, LLMModel, PluginManifest } from './types';
import { Anonymizer } from '../pii/Anonymizer';
import { analytics } from '../analytics';

export class ClaudePlugin implements LLMPlugin {
  id = 'claude-plugin';
  name = 'Claude (Anthropic)';
  version = '1.0.0';
  description = 'Anthropic Claude AI integration with PII protection';
  author = 'Ledebe';
  type = 'llm' as const;
  
  private anonymizer = new Anonymizer();
  
  manifest: PluginManifest = {
    permissions: ['network', 'storage'],
    settings: [
      {
        key: 'apiKey',
        label: 'Anthropic API Key',
        type: 'password',
        required: true
      },
      {
        key: 'model',
        label: 'Claude Model',
        type: 'select',
        required: true,
        options: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        default: 'claude-3-5-sonnet-20241022'
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'text',
        required: false,
        default: '1.0'
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'text',
        required: false,
        default: '4096'
      }
    ],
    capabilities: ['chat', 'conversation-history', 'pii-protection']
  };

  models: LLMModel[] = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Most intelligent model, best for complex tasks',
      maxTokens: 200000,
      costPer1kTokens: 0.003
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Powerful model for highly complex tasks',
      maxTokens: 200000,
      costPer1kTokens: 0.015
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed',
      maxTokens: 200000,
      costPer1kTokens: 0.003
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      description: 'Fastest model for simple tasks',
      maxTokens: 200000,
      costPer1kTokens: 0.00025
    }
  ];

  async chat(message: string, settings: Record<string, any>): Promise<string> {
    const { apiKey, model = 'claude-3-5-sonnet-20241022', temperature = 1.0, maxTokens = 4096 } = settings;
    
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    analytics.trackPluginUsage(this.id, 'chat_request', { model });

    const maskResult = this.anonymizer.mask(message);
    console.log('Original message masked for Claude:', maskResult.maskedText);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: parseInt(maxTokens),
          temperature: parseFloat(temperature),
          messages: [{ role: 'user', content: maskResult.maskedText }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = `Claude API error: ${error.error?.message || response.statusText}`;
        analytics.trackError('claude_api_error', { status: response.status, error: errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      let aiResponse = data.content[0]?.text || 'No response received';

      const restoreResult = this.anonymizer.unmask(aiResponse);
      analytics.trackModelUsage(this.id, model, 1);
      
      return restoreResult.restoredText;
    } catch (error) {
      console.error('Claude API error:', error);
      analytics.trackError('claude_request_failed', { error: error instanceof Error ? error.message : String(error), model });
      throw error;
    }
  }

  getModels(): LLMModel[] {
    return this.models;
  }

  clearAnonymizer(): void {
    this.anonymizer.clear();
  }
}
