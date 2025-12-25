/**
 * @fileoverview Analytics Dashboard for viewing usage statistics
 */

import { analytics, UsageMetrics } from '../analytics';

export class AnalyticsDashboard {
  private isVisible = false;

  /**
   * Show the analytics dashboard
   */
  show(): void {
    if (this.isVisible) return;

    const dashboard = document.createElement('div');
    dashboard.id = 'analytics-dashboard';
    dashboard.innerHTML = this.createDashboardHTML();
    
    document.body.appendChild(dashboard);
    this.isVisible = true;
    
    this.attachEventListeners();
    this.loadData();
  }

  /**
   * Hide the analytics dashboard
   */
  hide(): void {
    const dashboard = document.getElementById('analytics-dashboard');
    if (dashboard) {
      dashboard.remove();
      this.isVisible = false;
    }
  }

  private createDashboardHTML(): string {
    return `
      <div class="analytics-overlay">
        <div class="analytics-modal">
          <div class="analytics-header">
            <h2>📊 Usage Analytics</h2>
            <button class="close-analytics">&times;</button>
          </div>
          
          <div class="analytics-content">
            <div class="analytics-status">
              <div class="status-item">
                <span class="status-label">Analytics:</span>
                <span id="analytics-enabled-status" class="status-value">Loading...</span>
              </div>
              <div class="status-actions">
                <button id="toggle-analytics" class="btn-toggle">Toggle</button>
                <button id="export-data" class="btn-export">Export Data</button>
                <button id="clear-data" class="btn-clear">Clear Data</button>
              </div>
            </div>
            
            <div class="analytics-tabs">
              <button class="analytics-tab-btn active" data-tab="overview">Overview</button>
              <button class="analytics-tab-btn" data-tab="plugins">Plugins</button>
              <button class="analytics-tab-btn" data-tab="models">Models</button>
              <button class="analytics-tab-btn" data-tab="privacy">Privacy</button>
            </div>
            
            <div class="analytics-tab-content">
              <div class="tab-panel active" id="overview-panel">
                <div class="metrics-grid">
                  <div class="metric-card">
                    <h3>Conversations</h3>
                    <div class="metric-value" id="conversation-count">0</div>
                  </div>
                  <div class="metric-card">
                    <h3>Messages</h3>
                    <div class="metric-value" id="message-count">0</div>
                  </div>
                  <div class="metric-card">
                    <h3>Session Time</h3>
                    <div class="metric-value" id="session-duration">0m</div>
                  </div>
                  <div class="metric-card">
                    <h3>Features Used</h3>
                    <div class="metric-value" id="features-count">0</div>
                  </div>
                </div>
                
                <div class="features-list">
                  <h4>Features Used This Session</h4>
                  <div id="features-used" class="feature-tags"></div>
                </div>
              </div>
              
              <div class="tab-panel" id="plugins-panel">
                <h4>Plugin Usage</h4>
                <div id="plugin-usage-chart" class="usage-chart"></div>
              </div>
              
              <div class="tab-panel" id="models-panel">
                <h4>AI Model Usage</h4>
                <div id="model-usage-chart" class="usage-chart"></div>
              </div>
              
              <div class="tab-panel" id="privacy-panel">
                <div class="privacy-info">
                  <h4>🔒 Privacy Information</h4>
                  <div class="privacy-item">
                    <strong>Data Collection:</strong>
                    <p>Only anonymous usage statistics are collected when enabled. No personal information, conversation content, or PII is ever transmitted.</p>
                  </div>
                  <div class="privacy-item">
                    <strong>What We Track:</strong>
                    <ul>
                      <li>Plugin usage frequency</li>
                      <li>AI model selection</li>
                      <li>Feature usage patterns</li>
                      <li>Error occurrences (without details)</li>
                      <li>Session duration</li>
                    </ul>
                  </div>
                  <div class="privacy-item">
                    <strong>What We DON'T Track:</strong>
                    <ul>
                      <li>Your conversations or messages</li>
                      <li>Personal information or PII</li>
                      <li>API keys or credentials</li>
                      <li>File contents or names</li>
                      <li>Your identity or location</li>
                    </ul>
                  </div>
                  <div class="privacy-item">
                    <strong>Data Storage:</strong>
                    <p>All analytics data is stored locally on your device. You can export or delete it at any time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const dashboard = document.getElementById('analytics-dashboard');
    if (!dashboard) return;

    // Close button
    const closeBtn = dashboard.querySelector('.close-analytics');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click
    const overlay = dashboard.querySelector('.analytics-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // Tab switching
    const tabBtns = dashboard.querySelectorAll('.analytics-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const tabId = target.dataset.tab;
        this.switchTab(tabId || 'overview');
      });
    });

    // Action buttons
    const toggleBtn = dashboard.querySelector('#toggle-analytics');
    toggleBtn?.addEventListener('click', () => this.toggleAnalytics());

    const exportBtn = dashboard.querySelector('#export-data');
    exportBtn?.addEventListener('click', () => this.exportData());

    const clearBtn = dashboard.querySelector('#clear-data');
    clearBtn?.addEventListener('click', () => this.clearData());
  }

  private switchTab(tabId: string): void {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.analytics-tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update tab panels
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-panel`);
    });
  }

  private loadData(): void {
    const metrics = analytics.getUsageMetrics();
    
    // Update status
    const statusEl = document.getElementById('analytics-enabled-status');
    if (statusEl) {
      statusEl.textContent = analytics.isEnabled() ? '✅ Enabled' : '❌ Disabled';
      statusEl.className = `status-value ${analytics.isEnabled() ? 'enabled' : 'disabled'}`;
    }

    // Update overview metrics
    this.updateOverviewMetrics(metrics);
    this.updatePluginUsage(metrics);
    this.updateModelUsage(metrics);
  }

  private updateOverviewMetrics(metrics: UsageMetrics): void {
    const conversationCount = document.getElementById('conversation-count');
    const messageCount = document.getElementById('message-count');
    const sessionDuration = document.getElementById('session-duration');
    const featuresCount = document.getElementById('features-count');
    const featuresUsed = document.getElementById('features-used');

    if (conversationCount) conversationCount.textContent = metrics.conversation_count.toString();
    if (messageCount) messageCount.textContent = metrics.message_count.toString();
    if (sessionDuration) {
      const minutes = Math.floor(metrics.session_duration / 60000);
      sessionDuration.textContent = `${minutes}m`;
    }
    if (featuresCount) featuresCount.textContent = metrics.features_used.length.toString();
    
    if (featuresUsed) {
      featuresUsed.innerHTML = metrics.features_used
        .map(feature => `<span class="feature-tag">${feature.replace(/_/g, ' ')}</span>`)
        .join('');
    }
  }

  private updatePluginUsage(metrics: UsageMetrics): void {
    const chartEl = document.getElementById('plugin-usage-chart');
    if (!chartEl) return;

    const pluginEntries = Object.entries(metrics.plugin_usage);
    if (pluginEntries.length === 0) {
      chartEl.innerHTML = '<div class="no-data">No plugin usage data yet</div>';
      return;
    }

    const maxUsage = Math.max(...pluginEntries.map(([, count]) => count));
    
    chartEl.innerHTML = pluginEntries
      .sort(([, a], [, b]) => b - a)
      .map(([plugin, count]) => {
        const percentage = (count / maxUsage) * 100;
        return `
          <div class="usage-bar">
            <div class="usage-label">${plugin.replace('-plugin', '')}</div>
            <div class="usage-bar-container">
              <div class="usage-bar-fill" style="width: ${percentage}%"></div>
              <span class="usage-count">${count}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  private updateModelUsage(metrics: UsageMetrics): void {
    const chartEl = document.getElementById('model-usage-chart');
    if (!chartEl) return;

    const modelEntries = Object.entries(metrics.model_usage);
    if (modelEntries.length === 0) {
      chartEl.innerHTML = '<div class="no-data">No model usage data yet</div>';
      return;
    }

    const maxUsage = Math.max(...modelEntries.map(([, count]) => count));
    
    chartEl.innerHTML = modelEntries
      .sort(([, a], [, b]) => b - a)
      .map(([model, count]) => {
        const percentage = (count / maxUsage) * 100;
        return `
          <div class="usage-bar">
            <div class="usage-label">${model}</div>
            <div class="usage-bar-container">
              <div class="usage-bar-fill" style="width: ${percentage}%"></div>
              <span class="usage-count">${count} messages</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  private toggleAnalytics(): void {
    const newState = !analytics.isEnabled();
    analytics.setEnabled(newState);
    this.loadData();
  }

  private exportData(): void {
    try {
      const data = analytics.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledebe-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  }

  private clearData(): void {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analytics.clearData();
      this.loadData();
    }
  }
}

// Add styles
const dashboardStyles = `
#analytics-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3000;
}

.analytics-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.analytics-modal {
  background: white;
  width: 90%;
  max-width: 900px;
  height: 80%;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.analytics-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.analytics-header h2 {
  margin: 0;
  color: #1e293b;
}

.close-analytics {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
}

.analytics-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.analytics-status {
  padding: 15px 20px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-value.enabled {
  color: #16a34a;
}

.status-value.disabled {
  color: #dc2626;
}

.status-actions {
  display: flex;
  gap: 10px;
}

.btn-toggle, .btn-export, .btn-clear {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-toggle {
  background: #3b82f6;
  color: white;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-clear {
  background: #ef4444;
  color: white;
}

.analytics-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.analytics-tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  color: #64748b;
}

.analytics-tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.analytics-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.metric-card h3 {
  margin: 0 0 10px 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #1e293b;
}

.features-list h4 {
  margin-bottom: 15px;
  color: #1e293b;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.usage-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.usage-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.usage-label {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
  text-transform: capitalize;
}

.usage-bar-container {
  flex: 1;
  position: relative;
  background: #f3f4f6;
  border-radius: 4px;
  height: 24px;
  display: flex;
  align-items: center;
}

.usage-bar-fill {
  background: #3b82f6;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.usage-count {
  position: absolute;
  right: 8px;
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 40px;
}

.privacy-info {
  max-width: 600px;
}

.privacy-item {
  margin-bottom: 20px;
}

.privacy-item strong {
  color: #1e293b;
  display: block;
  margin-bottom: 8px;
}

.privacy-item p {
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.privacy-item ul {
  color: #64748b;
  line-height: 1.6;
  margin: 8px 0 0 20px;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardStyles;
document.head.appendChild(styleSheet);