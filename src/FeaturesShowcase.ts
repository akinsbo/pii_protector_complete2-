/**
 * @fileoverview Website Features Showcase
 */

export class FeaturesShowcase {
  private isVisible = false;

  show(): void {
    if (this.isVisible) return;

    const showcase = document.createElement('div');
    showcase.id = 'features-showcase';
    showcase.innerHTML = this.createShowcaseHTML();
    
    document.body.appendChild(showcase);
    this.isVisible = true;
    
    this.attachEventListeners();
  }

  hide(): void {
    const showcase = document.getElementById('features-showcase');
    if (showcase) {
      showcase.remove();
      this.isVisible = false;
    }
  }

  private createShowcaseHTML(): string {
    return `
      <div class="showcase-overlay">
        <div class="showcase-modal">
          <div class="showcase-header">
            <h2>🚀 Ledebe Protector Features</h2>
            <button class="close-showcase">&times;</button>
          </div>
          
          <div class="showcase-content">
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">🛡️</div>
                <h3>PII Protection</h3>
                <p>Automatically detect and mask emails, phone numbers, IBANs, credit cards, and custom sensitive terms.</p>
                <div class="feature-demo">
                  <div class="demo-input">john@company.com → [[LDB:EMAIL_1]]</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <h3>AI Chat Integration</h3>
                <p>Chat directly with ChatGPT, Claude, and other AI models while your sensitive data stays protected.</p>
                <div class="feature-demo">
                  <div class="demo-tags">
                    <span class="demo-tag">ChatGPT</span>
                    <span class="demo-tag">Claude</span>
                    <span class="demo-tag">Gemini</span>
                  </div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">🏪</div>
                <h3>Plugin Marketplace</h3>
                <p>Discover and install AI plugins from our marketplace. Easy one-click installation with ratings and reviews.</p>
                <div class="feature-demo">
                  <div class="demo-rating">⭐⭐⭐⭐⭐ 4.8/5</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">📁</div>
                <h3>Conversation Management</h3>
                <p>Organize your AI conversations in folders, search through history, and export important chats.</p>
                <div class="feature-demo">
                  <div class="demo-folders">
                    <span class="demo-folder">📁 Work</span>
                    <span class="demo-folder">📁 Personal</span>
                  </div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <h3>Privacy First</h3>
                <p>All conversations stored locally. Only masked data sent to AI services. You control your data completely.</p>
                <div class="feature-demo">
                  <div class="demo-privacy">🔐 Local Storage Only</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>Usage Analytics</h3>
                <p>Optional anonymous usage analytics to help improve the app. View your usage patterns and export data.</p>
                <div class="feature-demo">
                  <div class="demo-chart">📈 Usage Insights</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">⚙️</div>
                <h3>Customizable</h3>
                <p>Add custom terms, configure AI models, set up templates, and personalize your protection settings.</p>
                <div class="feature-demo">
                  <div class="demo-settings">Custom Terms: company-name</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">🌙</div>
                <h3>Dark Mode</h3>
                <p>Beautiful dark and light themes that adapt to your system preferences for comfortable use anytime.</p>
                <div class="feature-demo">
                  <div class="demo-theme">🌙 ☀️ Auto Theme</div>
                </div>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">💾</div>
                <h3>Templates & Export</h3>
                <p>Save frequently used prompts as templates and export your conversations for backup or sharing.</p>
                <div class="feature-demo">
                  <div class="demo-export">📄 JSON Export</div>
                </div>
              </div>
            </div>
            
            <div class="showcase-footer">
              <div class="version-info">
                <strong>Version 1.0.0</strong> • Professional PII Protection Suite
              </div>
              <div class="cta-buttons">
                <button id="try-ai-chat" class="cta-btn primary">🤖 Try AI Chat</button>
                <button id="browse-plugins" class="cta-btn secondary">🏪 Browse Plugins</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const showcase = document.getElementById('features-showcase');
    if (!showcase) return;

    // Close button
    const closeBtn = showcase.querySelector('.close-showcase');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click
    const overlay = showcase.querySelector('.showcase-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // CTA buttons
    const tryAiChatBtn = showcase.querySelector('#try-ai-chat');
    tryAiChatBtn?.addEventListener('click', () => {
      this.hide();
      document.dispatchEvent(new CustomEvent('open-ai-chat'));
    });

    const browsePluginsBtn = showcase.querySelector('#browse-plugins');
    browsePluginsBtn?.addEventListener('click', () => {
      this.hide();
      document.dispatchEvent(new CustomEvent('open-plugin-store'));
    });
  }
}

// Add styles
const showcaseStyles = `
#features-showcase {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2500;
}

.showcase-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.showcase-modal {
  background: white;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.showcase-header {
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.showcase-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.close-showcase {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-showcase:hover {
  background: rgba(255, 255, 255, 0.3);
}

.showcase-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.feature-card h3 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
}

.feature-card p {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.feature-demo {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
}

.demo-input {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #059669;
  font-weight: 500;
}

.demo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.demo-rating {
  color: #f59e0b;
  font-weight: 600;
}

.demo-folders {
  display: flex;
  gap: 8px;
}

.demo-folder {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.demo-privacy {
  color: #059669;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-chart {
  color: #3b82f6;
  font-weight: 600;
}

.demo-settings {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #7c3aed;
  font-size: 12px;
}

.demo-theme {
  font-size: 18px;
}

.demo-export {
  color: #059669;
  font-weight: 500;
}

.showcase-footer {
  border-top: 1px solid #e2e8f0;
  padding: 24px 32px;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.version-info {
  color: #64748b;
  font-size: 14px;
}

.cta-buttons {
  display: flex;
  gap: 12px;
}

.cta-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.cta-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cta-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.cta-btn.secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.cta-btn.secondary:hover {
  background: #667eea;
  color: white;
}

@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .showcase-footer {
    flex-direction: column;
    text-align: center;
  }
  
  .cta-buttons {
    width: 100%;
    justify-content: center;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = showcaseStyles;
document.head.appendChild(styleSheet);