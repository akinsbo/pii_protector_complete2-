/**
 * @fileoverview Plugin Marketplace for Ledebe Protector
 */

import { Plugin } from './types';
import { PluginManager } from './PluginManager';

export interface MarketplacePlugin extends Plugin {
  downloadUrl: string;
  rating: number;
  downloads: number;
  screenshots: string[];
  changelog: string;
  verified: boolean;
}

export class PluginMarketplace {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Create and show the marketplace interface
   */
  showMarketplace(): void {
    const marketplace = document.createElement('div');
    marketplace.id = 'plugin-marketplace';
    marketplace.innerHTML = `
      <div class="marketplace-overlay">
        <div class="marketplace-modal">
          <div class="marketplace-header">
            <h2>Plugin Marketplace</h2>
            <button class="close-marketplace">&times;</button>
          </div>
          
          <div class="marketplace-tabs">
            <button class="tab-btn active" data-tab="browse">Browse</button>
            <button class="tab-btn" data-tab="installed">Installed</button>
          </div>
          
          <div class="marketplace-content">
            <div class="tab-content active" id="browse-tab">
              <div class="search-bar">
                <input type="text" id="plugin-search" placeholder="Search plugins...">
                <select id="category-filter">
                  <option value="">All Categories</option>
                  <option value="llm">AI/LLM</option>
                  <option value="utility">Utilities</option>
                  <option value="integration">Integrations</option>
                </select>
              </div>
              <div class="plugins-grid" id="plugins-grid">
                <!-- Plugins will be loaded here -->
              </div>
            </div>
            
            <div class="tab-content" id="installed-tab">
              <div class="installed-plugins" id="installed-plugins">
                <!-- Installed plugins will be shown here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(marketplace);
    this.attachMarketplaceListeners();
    this.loadMarketplacePlugins();
    this.loadInstalledPlugins();
  }

  private attachMarketplaceListeners(): void {
    const marketplace = document.getElementById('plugin-marketplace');
    if (!marketplace) return;

    // Close marketplace
    const closeBtn = marketplace.querySelector('.close-marketplace');
    closeBtn?.addEventListener('click', () => {
      marketplace.remove();
    });

    // Tab switching
    const tabBtns = marketplace.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tabId = target.dataset.tab;
        this.switchTab(tabId || 'browse');
      });
    });

    // Search functionality
    const searchInput = marketplace.querySelector('#plugin-search') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
      this.filterPlugins();
    });

    // Category filter
    const categoryFilter = marketplace.querySelector('#category-filter') as HTMLSelectElement;
    categoryFilter?.addEventListener('change', () => {
      this.filterPlugins();
    });

    // Close on overlay click
    const overlay = marketplace.querySelector('.marketplace-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        marketplace.remove();
      }
    });
  }

  private switchTab(tabId: string): void {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
  }

  private async loadMarketplacePlugins(): Promise<void> {
    const pluginsGrid = document.getElementById('plugins-grid');
    if (!pluginsGrid) return;

    try {
      // Mock marketplace data - in real implementation, fetch from server
      const marketplacePlugins: MarketplacePlugin[] = [
        {
          id: 'claude-plugin',
          name: 'Claude Integration',
          version: '1.0.0',
          description: 'Anthropic Claude AI integration with advanced PII protection and conversation management',
          author: 'Ledebe Team',
          type: 'llm',
          downloadUrl: 'https://marketplace.ledebe.com/plugins/claude-plugin-1.0.0.zip',
          rating: 4.8,
          downloads: 1250,
          screenshots: ['screenshot1.png', 'screenshot2.png'],
          changelog: 'Initial release with Claude 3 support',
          verified: true,
          manifest: {
            permissions: ['network', 'storage'],
            settings: [
              { key: 'apiKey', label: 'Anthropic API Key', type: 'password', required: true }
            ],
            capabilities: ['chat', 'pii-protection', 'conversation-history']
          }
        },
        {
          id: 'gemini-plugin',
          name: 'Google Gemini',
          version: '1.0.0',
          description: 'Google Gemini AI integration with multimodal capabilities and PII protection',
          author: 'Ledebe Team',
          type: 'llm',
          downloadUrl: 'https://marketplace.ledebe.com/plugins/gemini-plugin-1.0.0.zip',
          rating: 4.6,
          downloads: 890,
          screenshots: ['screenshot1.png'],
          changelog: 'Initial release with Gemini Pro support',
          verified: true,
          manifest: {
            permissions: ['network', 'storage', 'camera'],
            settings: [
              { key: 'apiKey', label: 'Google AI API Key', type: 'password', required: true }
            ],
            capabilities: ['chat', 'multimodal', 'pii-protection']
          }
        },
        {
          id: 'ollama-plugin',
          name: 'Ollama Local AI',
          version: '1.0.0',
          description: 'Run AI models locally with Ollama - complete privacy and offline capability',
          author: 'Community',
          type: 'llm',
          downloadUrl: 'https://marketplace.ledebe.com/plugins/ollama-plugin-1.0.0.zip',
          rating: 4.9,
          downloads: 2100,
          screenshots: ['screenshot1.png', 'screenshot2.png', 'screenshot3.png'],
          changelog: 'Support for Llama 2, Code Llama, and Mistral models',
          verified: false,
          manifest: {
            permissions: ['network'],
            settings: [
              { key: 'endpoint', label: 'Ollama Endpoint', type: 'text', required: true, default: 'http://localhost:11434' }
            ],
            capabilities: ['chat', 'local-processing', 'offline']
          }
        }
      ];

      pluginsGrid.innerHTML = '';
      marketplacePlugins.forEach(plugin => {
        this.createPluginCard(plugin, pluginsGrid);
      });
    } catch (error) {
      console.error('Failed to load marketplace plugins:', error);
      pluginsGrid.innerHTML = '<div class="error">Failed to load plugins</div>';
    }
  }

  private createPluginCard(plugin: MarketplacePlugin, container: HTMLElement): void {
    const isInstalled = this.pluginManager.getPlugin(plugin.id) !== undefined;
    
    const card = document.createElement('div');
    card.className = 'plugin-card';
    card.innerHTML = `
      <div class="plugin-header">
        <h3>${plugin.name} ${plugin.verified ? '✓' : ''}</h3>
        <span class="plugin-version">v${plugin.version}</span>
      </div>
      
      <div class="plugin-meta">
        <span class="plugin-author">by ${plugin.author}</span>
        <span class="plugin-type">${plugin.type.toUpperCase()}</span>
      </div>
      
      <p class="plugin-description">${plugin.description}</p>
      
      <div class="plugin-stats">
        <span class="rating">⭐ ${plugin.rating}</span>
        <span class="downloads">📥 ${plugin.downloads.toLocaleString()}</span>
      </div>
      
      <div class="plugin-capabilities">
        ${plugin.manifest.capabilities.map(cap => `<span class="capability">${cap}</span>`).join('')}
      </div>
      
      <div class="plugin-actions">
        ${isInstalled 
          ? '<button class="btn-installed" disabled>Installed</button>'
          : `<button class="btn-install" data-plugin-id="${plugin.id}">Install</button>`
        }
        <button class="btn-details" data-plugin-id="${plugin.id}">Details</button>
      </div>
    `;

    // Attach event listeners
    const installBtn = card.querySelector('.btn-install');
    installBtn?.addEventListener('click', () => {
      this.installPlugin(plugin);
    });

    const detailsBtn = card.querySelector('.btn-details');
    detailsBtn?.addEventListener('click', () => {
      this.showPluginDetails(plugin);
    });

    container.appendChild(card);
  }

  private loadInstalledPlugins(): void {
    const installedContainer = document.getElementById('installed-plugins');
    if (!installedContainer) return;

    const installedPlugins = this.pluginManager.getAllPlugins();
    
    if (installedPlugins.length === 0) {
      installedContainer.innerHTML = '<div class="no-plugins">No plugins installed</div>';
      return;
    }

    installedContainer.innerHTML = '';
    installedPlugins.forEach(plugin => {
      const card = document.createElement('div');
      card.className = 'installed-plugin-card';
      card.innerHTML = `
        <div class="plugin-info">
          <h3>${plugin.name}</h3>
          <p>${plugin.description}</p>
          <span class="version">v${plugin.version}</span>
        </div>
        <div class="plugin-actions">
          <button class="btn-configure" data-plugin-id="${plugin.id}">Configure</button>
          <button class="btn-uninstall" data-plugin-id="${plugin.id}">Uninstall</button>
        </div>
      `;

      const configureBtn = card.querySelector('.btn-configure');
      configureBtn?.addEventListener('click', () => {
        this.configurePlugin(plugin.id);
      });

      const uninstallBtn = card.querySelector('.btn-uninstall');
      uninstallBtn?.addEventListener('click', () => {
        this.uninstallPlugin(plugin.id);
      });

      installedContainer.appendChild(card);
    });
  }

  private async installPlugin(plugin: MarketplacePlugin): Promise<void> {
    try {
      // Show loading state
      const installBtn = document.querySelector(`[data-plugin-id="${plugin.id}"].btn-install`) as HTMLButtonElement;
      if (installBtn) {
        installBtn.textContent = 'Installing...';
        installBtn.disabled = true;
      }

      // Simulate plugin installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, download and install the plugin
      console.log(`Installing plugin: ${plugin.name}`);
      
      // Update UI
      if (installBtn) {
        installBtn.textContent = 'Installed';
        installBtn.className = 'btn-installed';
      }

      // Refresh installed plugins tab
      this.loadInstalledPlugins();
      
    } catch (error) {
      console.error('Plugin installation failed:', error);
      alert(`Failed to install ${plugin.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private showPluginDetails(plugin: MarketplacePlugin): void {
    const details = document.createElement('div');
    details.id = 'plugin-details-modal';
    details.innerHTML = `
      <div class="details-overlay">
        <div class="details-modal">
          <div class="details-header">
            <h2>${plugin.name} ${plugin.verified ? '✓' : ''}</h2>
            <button class="close-details">&times;</button>
          </div>
          
          <div class="details-content">
            <div class="details-meta">
              <span>Version: ${plugin.version}</span>
              <span>Author: ${plugin.author}</span>
              <span>Downloads: ${plugin.downloads.toLocaleString()}</span>
              <span>Rating: ⭐ ${plugin.rating}</span>
            </div>
            
            <div class="details-description">
              <h3>Description</h3>
              <p>${plugin.description}</p>
            </div>
            
            <div class="details-permissions">
              <h3>Permissions Required</h3>
              <ul>
                ${plugin.manifest.permissions.map(perm => `<li>${perm}</li>`).join('')}
              </ul>
            </div>
            
            <div class="details-capabilities">
              <h3>Capabilities</h3>
              <div class="capabilities-list">
                ${plugin.manifest.capabilities.map(cap => `<span class="capability">${cap}</span>`).join('')}
              </div>
            </div>
            
            <div class="details-changelog">
              <h3>Changelog</h3>
              <p>${plugin.changelog}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(details);

    // Close handler
    const closeBtn = details.querySelector('.close-details');
    closeBtn?.addEventListener('click', () => {
      details.remove();
    });

    const overlay = details.querySelector('.details-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        details.remove();
      }
    });
  }

  private configurePlugin(pluginId: string): void {
    // Close marketplace and open plugin settings
    const marketplace = document.getElementById('plugin-marketplace');
    marketplace?.remove();
    
    // Trigger plugin settings modal (this would be handled by ChatInterface)
    const event = new CustomEvent('configure-plugin', { detail: { pluginId } });
    document.dispatchEvent(event);
  }

  private uninstallPlugin(pluginId: string): void {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      this.pluginManager.uninstallPlugin(pluginId);
      this.loadInstalledPlugins();
    }
  }

  private filterPlugins(): void {
    const searchTerm = (document.getElementById('plugin-search') as HTMLInputElement)?.value.toLowerCase() || '';
    const category = (document.getElementById('category-filter') as HTMLSelectElement)?.value || '';
    
    const pluginCards = document.querySelectorAll('.plugin-card');
    pluginCards.forEach(card => {
      const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('.plugin-description')?.textContent?.toLowerCase() || '';
      const type = card.querySelector('.plugin-type')?.textContent?.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || name.includes(searchTerm) || description.includes(searchTerm);
      const matchesCategory = !category || type.includes(category);
      
      (card as HTMLElement).style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
  }
}