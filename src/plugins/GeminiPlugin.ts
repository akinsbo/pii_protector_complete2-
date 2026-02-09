/**
 * @fileoverview Gemini Plugin with PII protection for Ledebe Protector
 */

import { LLMPlugin, LLMModel, PluginManifest } from './types';
import { Anonymizer } from '../pii/Anonymizer';
import { analytics } from '../analytics';

export class GeminiPlugin implements LLMPlugin {
  id = 'gemini-plugin';
  name = 'Gemini (Google)';
  version = '1.0.0';
  description = 'Google Gemini AI integration with PII protection';
  author = 'Ledebe';
  type = 'llm' as const;
  
  private anonymizer = new Anonymizer();
  
  manifest: PluginManifest = {
    permissions: ['network', 'storage'],
    settings: [
      {
        key: 'apiKey',
        label: 'Google AI API Key',
        type: 'password',
        required: true
      },
      {
        key: 'model',
        label: 'Gemini Model',
        type: 'select',
        required: true,
        options: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        default: 'gemini-1.5-flash'
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'text',
        required: false,
        default: '0.9'
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'text',
        required: false,
        default: '8192'
      }
    ],
    capabilities: ['chat', 'conversation-history', 'pii-protection']
  };

  models: LLMModel[] = [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable model with long context',
      maxTokens: 2097152,
      costPer1kTokens: 0.00125
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and efficient for most tasks',
      maxTokens: 1048576,
      costPer1kTokens: 0.000075
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      description: 'Balanced performance',
      maxTokens: 32768,
      costPer1kTokens: 0.0005
    }
  ];

  async chat(message: string, settings: Record<string, any>): Promise<string> {
    const { apiKey, model = 'gemini-1.5-flash', temperature = 0.9, maxTokens = 8192 } = settings;
    
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }

    analytics.trackPluginUsage(this.id, 'chat_request', { model });

    const maskResult = this.anonymizer.mask(message);
    console.log('Original message masked for Gemini:', maskResult.maskedText);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: maskResult.maskedText }]
          }],
          generationConfig: {
            temperature: parseFloat(temperature),
            maxOutputTokens: parseInt(maxTokens)
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = `Gemini API error: ${error.error?.message || response.statusText}`;
        analytics.trackError('gemini_api_error', { status: response.status, error: errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

      const restoreResult = this.anonymizer.unmask(aiResponse);
      analytics.trackModelUsage(this.id, model, 1);
      
      return restoreResult.restoredText;
    } catch (error) {
      console.error('Gemini API error:', error);
      analytics.trackError('gemini_request_failed', { error: error instanceof Error ? error.message : String(error), model });
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
