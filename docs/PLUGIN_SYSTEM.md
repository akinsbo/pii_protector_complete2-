# Plugin System Documentation

## Overview

The Ledebe Protector Plugin System enables users to integrate AI/LLM services directly into the application with automatic PII protection. Users can select plugins from a marketplace, configure their API keys, and chat with AI models while ensuring sensitive information is automatically masked before being sent to external services.

## Features

### 🤖 AI Chat Integration
- **Direct AI Access**: Chat with ChatGPT, Claude, Gemini, and other AI models
- **PII Protection**: Automatic masking of sensitive data before sending to AI
- **Model Selection**: Choose from different AI models (GPT-4, GPT-3.5, etc.)
- **Real-time Chat**: Instant responses with typing indicators

### 📁 Conversation Management
- **Conversation History**: All chats are saved locally with PII protection
- **Folder Organization**: Create folders to organize conversations by topic
- **Search Functionality**: Find conversations by title or content
- **Export Conversations**: Export chat history as JSON files

### 🏪 Plugin Marketplace
- **Plugin Discovery**: Browse available AI plugins
- **Easy Installation**: One-click plugin installation
- **Plugin Ratings**: Community ratings and download counts
- **Verified Plugins**: Official plugins marked with verification badges

### 🔒 Privacy & Security
- **Local Storage**: All conversations stored locally on your device
- **PII Masking**: Emails, phone numbers, IBANs, and custom terms automatically protected
- **API Key Security**: Encrypted storage of API credentials
- **No Data Sharing**: Your conversations never leave your device (except masked data to AI)

## Quick Start

### 1. Access the Plugin System
- Click the **🤖 AI Chat** button in the top-right corner of the app
- Or click **🏪 Plugin Store** to browse available plugins

### 2. Install a Plugin
1. Open the Plugin Store
2. Browse available AI plugins (ChatGPT, Claude, Gemini, etc.)
3. Click **Install** on your preferred plugin
4. Wait for installation to complete

### 3. Configure Your Plugin
1. Select your installed plugin from the dropdown
2. Click the **⚙️** settings button
3. Enter your API key (e.g., OpenAI API key for ChatGPT)
4. Choose your preferred model
5. Save settings

### 4. Start Chatting
1. Create a new conversation
2. Select your AI model
3. Start typing - PII will be automatically protected
4. Enjoy secure AI conversations!

## Supported AI Providers

### ChatGPT (OpenAI)
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Setup**: Requires OpenAI API key
- **Features**: Advanced reasoning, code generation, creative writing

### Claude (Anthropic) - Coming Soon
- **Models**: Claude 3 Opus, Claude 3 Sonnet
- **Setup**: Requires Anthropic API key
- **Features**: Long context, safety-focused responses

### Gemini (Google) - Coming Soon
- **Models**: Gemini Pro, Gemini Pro Vision
- **Setup**: Requires Google AI API key
- **Features**: Multimodal capabilities, image understanding

### Ollama (Local AI) - Coming Soon
- **Models**: Llama 2, Code Llama, Mistral
- **Setup**: Requires local Ollama installation
- **Features**: Complete privacy, offline operation

## PII Protection Details

The plugin system automatically protects the following types of sensitive information:

### Automatically Detected PII
- **Email Addresses**: `user@example.com` → `[[LDB:EMAIL_1]]`
- **Phone Numbers**: `+1-555-123-4567` → `[[LDB:PHONE_1]]`
- **IP Addresses**: `192.168.1.1` → `[[LDB:IP_1]]`
- **IBAN Codes**: `GB82WEST12345698765432` → `[[LDB:IBAN_1]]`
- **Credit Cards**: `4111-1111-1111-1111` → `[[LDB:CARD_1]]`
- **ID Numbers**: `12345678901` → `[[LDB:NIN_1]]`

### Custom Terms
- Add your own sensitive terms in settings
- Company names, project codenames, personal identifiers
- Automatically masked in all conversations

### How It Works
1. **Input Masking**: Your message is scanned for PII before sending to AI
2. **Secure Transmission**: Only masked placeholders are sent to external AI services
3. **Response Restoration**: AI responses are checked for placeholders and restored
4. **Local Storage**: Original unmasked conversations stored locally for your reference

## File Structure

```
src/plugins/
├── types.ts                 # TypeScript interfaces and types
├── PluginManager.ts         # Plugin lifecycle management
├── ChatManager.ts           # Conversation and folder management
├── ChatInterface.ts         # Main chat UI component
├── ChatGPTPlugin.ts         # ChatGPT integration plugin
├── PluginMarketplace.ts     # Plugin discovery and installation
├── chat-interface.css       # UI styles
└── index.ts                 # Main plugin system entry point
```

## API Reference

### Plugin Interface
```typescript
interface LLMPlugin extends Plugin {
  type: 'llm';
  models: LLMModel[];
  chat(message: string, settings: Record<string, any>): Promise<string>;
  getModels(): LLMModel[];
}
```

### Chat Manager
```typescript
class ChatManager {
  createConversation(title: string, model: string, folderId?: string): ChatConversation;
  addMessage(conversationId: string, content: string, role: 'user' | 'assistant'): ChatMessage;
  createFolder(name: string, parentId?: string): ChatFolder;
  searchConversations(query: string): ChatConversation[];
  exportConversation(id: string): string;
}
```

### Plugin Manager
```typescript
class PluginManager {
  getPlugin(id: string): Plugin | undefined;
  getLLMPlugins(): LLMPlugin[];
  setPluginSettings(pluginId: string, settings: Record<string, any>): void;
  getPluginSettings(pluginId: string): Record<string, any>;
}
```

## Development

### Creating a Custom Plugin

1. **Implement the LLMPlugin interface**:
```typescript
export class MyAIPlugin implements LLMPlugin {
  id = 'my-ai-plugin';
  name = 'My AI Service';
  type = 'llm' as const;
  
  async chat(message: string, settings: Record<string, any>): Promise<string> {
    // Your AI integration logic here
    // The message is already PII-masked
    return aiResponse;
  }
  
  getModels(): LLMModel[] {
    return [/* your models */];
  }
}
```

2. **Register your plugin**:
```typescript
const pluginManager = new PluginManager();
pluginManager.registerPlugin(new MyAIPlugin());
```

### Plugin Settings Schema
```typescript
interface PluginSetting {
  key: string;           // Setting identifier
  label: string;         // Display name
  type: 'text' | 'password' | 'select' | 'boolean';
  required: boolean;     // Is this setting required?
  options?: string[];    // For select type
  default?: any;         // Default value
}
```

## Security Considerations

### API Key Storage
- API keys are stored in encrypted local storage
- Keys are never logged or transmitted except to their respective AI services
- Users can clear stored credentials at any time

### Data Privacy
- All conversations are stored locally on the user's device
- Only PII-masked content is sent to external AI services
- No conversation data is shared with Ledebe or third parties
- Users have full control over their data

### Network Security
- All API communications use HTTPS
- API keys are transmitted securely to AI providers
- No man-in-the-middle data collection

## Troubleshooting

### Common Issues

**Plugin not loading**
- Check if the plugin is properly installed
- Verify API key is correctly configured
- Check browser console for error messages

**API key errors**
- Ensure API key is valid and has sufficient credits
- Check if API key has required permissions
- Verify the correct API endpoint is being used

**PII not being masked**
- Check if custom terms are properly configured
- Verify PII detection patterns are working
- Review the anonymizer settings

**Conversations not saving**
- Check browser local storage permissions
- Ensure sufficient storage space is available
- Try clearing browser cache and restarting

### Getting Help

1. **Check the logs**: Open browser DevTools → Console
2. **Review settings**: Verify all plugin configurations
3. **Test with simple messages**: Start with basic text to isolate issues
4. **Contact support**: Use the feedback system in the main app

## Roadmap

### Upcoming Features
- **More AI Providers**: Anthropic Claude, Google Gemini, local Ollama
- **Advanced PII Detection**: Custom regex patterns, ML-based detection
- **Plugin SDK**: Tools for third-party plugin development
- **Cloud Sync**: Optional encrypted cloud backup of conversations
- **Team Features**: Shared plugin configurations and templates
- **Voice Integration**: Speech-to-text and text-to-speech capabilities

### Version History
- **v1.0.0**: Initial release with ChatGPT integration and PII protection
- **v1.1.0**: Plugin marketplace and conversation management (planned)
- **v1.2.0**: Additional AI providers and advanced features (planned)