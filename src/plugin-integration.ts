/**
 * @fileoverview Integration of Plugin System with Main Renderer
 */

import { pluginSystem } from './plugins';
import { PluginMarketplace } from './plugins/PluginMarketplace';

// Add plugin system integration to the main app
export function initializePluginSystem(): void {
  // Add plugin menu to the main interface
  addPluginMenu();
  
  // Initialize the plugin system
  pluginSystem.initialize().catch(console.error);
}

function addPluginMenu(): void {
  // Find the main menu or create one
  let mainMenu = document.querySelector('.main-menu');
  if (!mainMenu) {
    mainMenu = document.createElement('div');
    mainMenu.className = 'main-menu';
    document.body.appendChild(mainMenu);
  }

  // Add plugin menu items
  const pluginMenu = document.createElement('div');
  pluginMenu.className = 'plugin-menu';
  pluginMenu.innerHTML = `
    <button id="open-chat" class="menu-btn">
      🤖 AI Chat
    </button>
    <button id="open-marketplace" class="menu-btn">
      🏪 Plugin Store
    </button>
  `;

  mainMenu.appendChild(pluginMenu);

  // Add event listeners
  const openChatBtn = document.getElementById('open-chat');
  const openMarketplaceBtn = document.getElementById('open-marketplace');

  openChatBtn?.addEventListener('click', () => {
    pluginSystem.showChatInterface();
  });

  openMarketplaceBtn?.addEventListener('click', () => {
    const marketplace = new PluginMarketplace(pluginSystem.getPluginManager());
    marketplace.showMarketplace();
  });

  // Listen for events from main app buttons
  document.addEventListener('open-ai-chat', () => {
    console.log('open-ai-chat event received');
    pluginSystem.showChatInterface();
  });

  document.addEventListener('open-plugin-store', () => {
    const marketplace = new PluginMarketplace(pluginSystem.getPluginManager());
    marketplace.showMarketplace();
  });

  // Listen for plugin configuration events
  document.addEventListener('configure-plugin', (event: any) => {
    const { pluginId } = event.detail;
    // Show plugin settings (this would trigger the ChatInterface settings modal)
    console.log('Configure plugin:', pluginId);
  });
}

// Add basic menu styles
const menuStyles = `
.main-menu {
  display: none;
}

.plugin-menu {
  display: flex;
  gap: 10px;
}

.menu-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.menu-btn:active {
  transform: translateY(0);
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = menuStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePluginSystem();
  });
}