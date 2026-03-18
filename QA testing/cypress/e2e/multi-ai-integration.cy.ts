describe('Multi-AI Integration Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(1000);
  });

  describe('Existing Core Functionality', () => {
    it('should load application without errors', () => {
      cy.get('.app-container').should('be.visible');
      cy.get('#text-input').should('be.visible');
      cy.get('#send-btn').should('be.visible');
    });

    it('should protect PII in text input', () => {
      const testText = 'My email is john@example.com and phone is 555-123-4567';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.chat-message').should('exist');
      cy.get('.message-tab').contains('Protected Text').click();
      cy.get('.message-text').should('contain', '[LDB_EMAIL');
      cy.get('.message-text').should('contain', '[LDB_PHONE');
    });

    it('should switch between plain and protected views', () => {
      const testText = 'Contact me at test@email.com';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.message-tab').contains('Plain Text').click();
      cy.get('.message-text').should('contain', 'test@email.com');
      
      cy.get('.message-tab').contains('Protected Text').click();
      cy.get('.message-text').should('contain', '[LDB_EMAIL');
    });

    it('should save and load history', () => {
      const testText = 'Test message for history';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.history-item').should('exist');
      cy.get('.history-item').first().should('contain', 'Test message');
    });

    it('should handle custom terms', () => {
      cy.get('#custom-terms').clear().type('TestCompany\nJohnDoe');
      
      const testText = 'I work at TestCompany with JohnDoe';
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.message-tab').contains('Protected Text').click();
      cy.get('.message-text').should('contain', '[LDB_CUSTOM');
    });

    it('should copy protected text', () => {
      const testText = 'Email: user@test.com';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.message-action-btn[data-label="Copy"]').first().click();
      cy.get('.toast').should('be.visible').and('contain', 'copied');
    });

    it('should delete messages', () => {
      cy.get('#text-input').type('Test message to delete');
      cy.get('#send-btn').click();
      
      cy.get('.chat-message').should('have.length.at.least', 1);
      
      cy.get('.message-action-btn[data-label="Delete"]').first().click();
      cy.on('window:confirm', () => true);
    });

    it('should create new chat', () => {
      cy.get('#text-input').type('First message');
      cy.get('#send-btn').click();
      
      cy.get('.new-chat-btn').click();
      cy.get('.welcome-prompt').should('be.visible');
      cy.get('.chat-message').should('not.exist');
    });

    it('should toggle dark mode', () => {
      cy.get('#darkMode').check();
      cy.get('html').should('have.attr', 'data-theme', 'dark');
      
      cy.get('#darkMode').uncheck();
      cy.get('html').should('have.attr', 'data-theme', 'light');
    });

    it('should handle keyboard shortcuts', () => {
      cy.get('#text-input').type('Test message');
      cy.get('#text-input').type('{ctrl}{enter}');
      
      cy.get('.chat-message').should('exist');
    });

    it('should show shortcuts modal', () => {
      cy.get('body').type('{ctrl}/');
      cy.get('#shortcuts-modal').should('have.class', 'show');
      
      cy.get('body').type('{esc}');
      cy.get('#shortcuts-modal').should('not.have.class', 'show');
    });
  });

  describe('File Upload Functionality', () => {
    it('should handle text file upload', () => {
      const fileName = 'test.txt';
      const fileContent = 'Test content with email@test.com';
      
      cy.get('#file-input').selectFile({
        contents: Cypress.Buffer.from(fileContent),
        fileName: fileName,
        mimeType: 'text/plain'
      }, { force: true });
      
      cy.get('.uploaded-file', { timeout: 5000 }).should('be.visible');
    });

    it('should remove uploaded file', () => {
      const fileName = 'test.txt';
      
      cy.get('#file-input').selectFile({
        contents: Cypress.Buffer.from('Test'),
        fileName: fileName,
        mimeType: 'text/plain'
      }, { force: true });
      
      cy.get('.uploaded-file button').click();
      cy.get('.uploaded-file').should('not.exist');
    });
  });

  describe('Multi-AI Feature Tests', () => {
    it('should not break when AI chat button exists', () => {
      // Check if AI chat integration exists without breaking main app
      cy.get('.app-container').should('be.visible');
      cy.get('#text-input').should('be.visible');
    });

    it('should maintain PII protection with AI features', () => {
      const testText = 'My email is protected@test.com';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.message-tab').contains('Protected Text').click();
      cy.get('.message-text').should('contain', '[LDB_EMAIL');
      cy.get('.message-text').should('not.contain', 'protected@test.com');
    });

    it('should preserve localStorage data', () => {
      const testText = 'Test for localStorage';
      
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.reload();
      
      cy.get('.history-item').should('exist');
    });

    it('should handle custom terms with AI features', () => {
      cy.get('#custom-terms').clear().type('SecretCompany');
      
      const testText = 'I work at SecretCompany';
      cy.get('#text-input').type(testText);
      cy.get('#send-btn').click();
      
      cy.get('.message-tab').contains('Protected Text').click();
      cy.get('.message-text').should('contain', '[LDB_CUSTOM');
    });
  });

  describe('Settings and Configuration', () => {
    it('should open and close settings modal', () => {
      cy.contains('button', 'Settings').click();
      cy.get('#settings-modal').should('have.class', 'show');
      
      cy.get('#settings-modal').click(5, 5);
      cy.get('#settings-modal').should('not.have.class', 'show');
    });

    it('should save settings', () => {
      cy.contains('button', 'Settings').click();
      cy.get('#settings-language').select('es');
      cy.contains('button', 'Save Settings').click();
      
      cy.get('.toast').should('contain', 'saved');
    });

    it('should persist dark mode preference', () => {
      cy.get('#darkMode').check();
      cy.reload();
      cy.get('#darkMode').should('be.checked');
    });

    it('should persist custom terms', () => {
      cy.get('#custom-terms').clear().type('PersistentTerm');
      cy.get('.save-close-btn').click();
      
      cy.reload();
      cy.get('#custom-terms').should('contain', 'PersistentTerm');
    });
  });

  describe('History Management', () => {
    it('should create history items', () => {
      cy.get('#text-input').type('History test message');
      cy.get('#send-btn').click();
      
      cy.get('.history-item').should('have.length.at.least', 1);
    });

    it('should load history item', () => {
      cy.get('#text-input').type('First message');
      cy.get('#send-btn').click();
      
      cy.get('.new-chat-btn').click();
      
      cy.get('.history-item').first().click();
      cy.get('.chat-message').should('exist');
    });

    it('should rename history item', () => {
      cy.get('#text-input').type('Message to rename');
      cy.get('#send-btn').click();
      
      cy.get('.history-actions button').first().click();
      cy.get('.history-menu-item').contains('Rename').click();
      
      cy.on('window:prompt', () => 'New Name');
    });

    it('should delete history item', () => {
      cy.get('#text-input').type('Message to delete');
      cy.get('#send-btn').click();
      
      const initialCount = cy.get('.history-item').its('length');
      
      cy.get('.history-actions button').first().click();
      cy.get('.history-menu-item.delete').click();
      cy.on('window:confirm', () => true);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.get('.app-container').should('be.visible');
      cy.get('#text-input').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.get('.app-container').should('be.visible');
      cy.get('#text-input').should('be.visible');
    });

    it('should toggle sidebar on mobile', () => {
      cy.viewport('iphone-x');
      cy.get('#sidebar-toggle-btn').click();
      cy.get('#history-sidebar').should('have.class', 'mobile-open');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input gracefully', () => {
      cy.get('#send-btn').click();
      cy.get('.chat-message').should('not.exist');
    });

    it('should handle invalid file types', () => {
      cy.get('#file-input').selectFile({
        contents: Cypress.Buffer.from('test'),
        fileName: 'test.exe',
        mimeType: 'application/x-msdownload'
      }, { force: true });
      
      // Should not crash
      cy.get('.app-container').should('be.visible');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      cy.get('#text-input').invoke('val', longText);
      cy.get('#send-btn').click();
      
      cy.get('.chat-message').should('exist');
    });
  });

  describe('Performance', () => {
    it('should handle multiple messages efficiently', () => {
      for (let i = 0; i < 5; i++) {
        cy.get('#text-input').type(`Message ${i}`);
        cy.get('#send-btn').click();
        cy.wait(100);
      }
      
      cy.get('.chat-message').should('have.length.at.least', 5);
    });

    it('should not slow down with many history items', () => {
      // Create multiple history items
      for (let i = 0; i < 3; i++) {
        cy.get('#text-input').type(`History ${i}`);
        cy.get('#send-btn').click();
        cy.get('.new-chat-btn').click();
      }
      
      cy.get('.history-item').should('have.length.at.least', 3);
      cy.get('.history-item').first().click();
      cy.get('.chat-message').should('exist');
    });
  });

  describe('Data Persistence', () => {
    it('should persist messages across page reloads', () => {
      const uniqueText = `Unique message ${Date.now()}`;
      
      cy.get('#text-input').type(uniqueText);
      cy.get('#send-btn').click();
      
      cy.reload();
      
      cy.get('.history-item').should('contain', uniqueText.substring(0, 20));
    });

    it('should persist custom terms across sessions', () => {
      const customTerm = `CustomTerm${Date.now()}`;
      
      cy.get('#custom-terms').clear().type(customTerm);
      cy.get('.save-close-btn').click();
      
      cy.reload();
      
      cy.get('#custom-terms').should('contain', customTerm);
    });

    it('should clear data when requested', () => {
      cy.get('#text-input').type('Test message');
      cy.get('#send-btn').click();
      
      cy.clearLocalStorage();
      cy.reload();
      
      cy.get('.history-list').should('contain', 'No history yet');
    });
  });
});
