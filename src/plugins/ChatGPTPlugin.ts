/**
 * @fileoverview ChatGPT Plugin with PII protection for Ledebe Protector
 */

import { LLMPlugin, LLMModel, PluginManifest } from './types';
import { Anonymizer } from '../pii/Anonymizer';
import { analytics } from '../analytics';

export class ChatGPTPlugin implements LLMPlugin {
  id = 'chatgpt-plugin';
  name = 'ChatGPT Integration';
  version = '1.0.0';
  description = 'Direct ChatGPT integration with PII protection';
  author = 'Ledebe';
  type = 'llm' as const;
  
  private anonymizer = new Anonymizer();
  
  manifest: PluginManifest = {
    permissions: ['network', 'storage'],
    settings: [
      {
        key: 'apiKey',
        label: 'OpenAI API Key',
        type: 'password',
        required: true
      },
      {
        key: 'model',
        label: 'ChatGPT Model',
        type: 'select',
        required: true,
        options: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
        default: 'gpt-3.5-turbo'
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'text',
        required: false,
        default: '0.7'
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'text',
        required: false,
        default: '2048'
      }
    ],
    capabilities: ['chat', 'conversation-history', 'pii-protection']
  };

  models: LLMModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model, best for complex tasks',
      maxTokens: 8192,
      costPer1kTokens: 0.03
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Faster and more cost-effective than GPT-4',
      maxTokens: 128000,
      costPer1kTokens: 0.01
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Multimodal model with vision and advanced reasoning',
      maxTokens: 128000,
      costPer1kTokens: 0.005
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient for most tasks',
      maxTokens: 4096,
      costPer1kTokens: 0.002
    }
  ];

  async chat(message: string, settings: Record<string, any>): Promise<string> {
    const { apiKey, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 2048 } = settings;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Track plugin usage
    analytics.trackPluginUsage(this.id, 'chat_request', { model });

    // Mask PII before sending to ChatGPT
    const maskResult = this.anonymizer.mask(message);
    console.log('Original message masked for ChatGPT:', maskResult.maskedText);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: maskResult.maskedText }],
          temperature: parseFloat(temperature),
          max_tokens: parseInt(maxTokens)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = `OpenAI API error: ${error.error?.message || response.statusText}`;
        analytics.trackError('chatgpt_api_error', { status: response.status, error: errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content || 'No response received';

      // Restore PII in the response if it contains placeholders
      const restoreResult = this.anonymizer.unmask(aiResponse);
      
      // Track successful usage
      analytics.trackModelUsage(this.id, model, 1);
      
      return restoreResult.restoredText;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      analytics.trackError('chatgpt_request_failed', { error: error instanceof Error ? error.message : String(error), model });
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