describe('PII Protector - Advanced Features', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should handle complex PII patterns', () => {
    const complexText = `
      Contact Information:
      - Primary: john.doe@company.com
      - Secondary: j.doe+work@company.co.uk
      - Phone: +1 (555) 123-4567
      - Mobile: 555.987.6543
      - International: +44 20 7946 0958
      
      Personal Details:
      - SSN: 123-45-6789
      - Credit Card: 4532 1234 5678 9012
      - Another Card: 5555-5555-5555-4444
      
      Addresses:
      - Home: 123 Main St, Anytown, CA 90210
      - Work: 456 Business Ave, Suite 100, Corporate City, NY 10001
    `
    
    cy.typeAndProtect(complexText)
    
    // Should protect multiple types of PII
    cy.get('.protection-badge').should('contain', 'protected')
    cy.get('.message-text[data-view="protected"]')
      .should('contain', '[LDB_EMAIL')
      .should('contain', '[LDB_PHONE')
  })

  it('should maintain protection consistency across sessions', () => {
    cy.fixture('testData').then((data) => {
      // Add custom terms
      cy.get('#custom-terms').clear().type(data.customTerms.join('\\n'))
      cy.get('.save-close-btn').click()
      
      // Send message with PII
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Reload page
      cy.reload()
      cy.wait(1000)
      
      // Custom terms should be preserved
      cy.get('#custom-terms').should('contain.value', data.customTerms[0])
      
      // History should be preserved
      cy.get('.history-item').should('have.length.at.least', 1)
    })
  })

  it('should handle mixed content with code and data', () => {
    const mixedContent = `
      Here's my email configuration:
      
      const config = {
        email: "admin@mycompany.com",
        smtp: "smtp.mycompany.com",
        port: 587,
        auth: {
          user: "admin@mycompany.com",
          pass: "secretpassword123"
        }
      };
      
      And my personal contact: john.personal@gmail.com
      Phone: 555-123-4567
    `
    
    cy.typeAndProtect(mixedContent)
    
    // Should protect emails in both code and text
    cy.get('.message-text[data-view="protected"]')
      .should('contain', '[LDB_EMAIL')
      .should('not.contain', 'admin@mycompany.com')
      .should('not.contain', 'john.personal@gmail.com')
  })

  it('should handle international phone numbers', () => {
    const internationalText = `
      International contacts:
      - US: +1-555-123-4567
      - UK: +44 20 7946 0958
      - Germany: +49 30 12345678
      - France: +33 1 42 86 83 26
      - Japan: +81 3 1234 5678
    `
    
    cy.typeAndProtect(internationalText)
    
    cy.get('.message-text[data-view="protected"]')
      .should('contain', '[LDB_PHONE')
      .should('not.contain', '+1-555-123-4567')
      .should('not.contain', '+44 20 7946 0958')
  })

  it('should preserve formatting in protected text', () => {
    const formattedText = `
      IMPORTANT DOCUMENT
      ==================
      
      Name: John Smith
      Email: john@company.com
      Phone: 555-123-4567
      
      Notes:
      - First contact: john@company.com
      - Backup phone: 555-987-6543
      
      End of document.
    `
    
    cy.typeAndProtect(formattedText)
    
    // Check that formatting is preserved
    cy.get('.message-text[data-view="protected"]')
      .should('contain', 'IMPORTANT DOCUMENT')
      .should('contain', 'Notes:')
      .should('contain', 'End of document.')
  })

  it('should handle edge cases in PII detection', () => {
    const edgeCases = `
      Edge cases to test:
      - Not an email: @company.com
      - Not an email: user@
      - Not a phone: 123
      - Not a phone: 555-12
      - Valid email: valid@test.com
      - Valid phone: 555-123-4567
      - Email in sentence: Contact me at support@company.com for help.
      - Phone in sentence: Call us at (555) 123-4567 today!
    `
    
    cy.typeAndProtect(edgeCases)
    
    // Should only protect valid PII
    cy.get('.message-text[data-view="protected"]')
      .should('contain', '[LDB_EMAIL')
      .should('contain', '[LDB_PHONE')
      .should('contain', '@company.com') // Invalid email should remain
      .should('contain', 'user@') // Invalid email should remain
  })
})

describe('PII Protector - Workflow Integration', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should support complete protection workflow', () => {
    cy.fixture('testData').then((data) => {
      // Step 1: Add custom terms
      cy.get('#custom-terms').clear().type(data.customTerms.join('\\n'))
      
      // Step 2: Protect text with both standard and custom PII
      cy.typeAndProtect(data.sampleTexts.withCustomTerms + ' Email: test@example.com')
      
      // Step 3: Verify protection
      cy.get('.protection-badge').should('be.visible')
      
      // Step 4: Copy protected text (simulate)
      cy.get('.message-action-btn[data-label="Copy"]').click()
      
      // Step 5: Create new chat for restoration test
      cy.get('.new-chat-btn').click()
      
      // Step 6: Simulate AI response with placeholders
      const aiResponse = 'Here is your processed text with [LDB_EMAIL1] and [LDB_CUSTOM1]'
      cy.typeAndProtect(aiResponse)
      
      // Should handle restoration patterns
      cy.get('.chat-message').should('be.visible')
    })
  })

  it('should maintain state across multiple operations', () => {
    cy.fixture('testData').then((data) => {
      // Multiple protection operations
      cy.typeAndProtect(data.sampleTexts.emailOnly)
      cy.typeAndProtect(data.sampleTexts.phoneOnly)
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Should have multiple history items
      cy.get('.history-item').should('have.length', 3)
      
      // Should be able to navigate between them
      cy.get('.history-item').first().click()
      cy.get('.chat-message').should('have.length', 1)
      
      cy.get('.history-item').eq(1).click()
      cy.get('.chat-message').should('have.length', 1)
    })
  })

  it('should handle rapid successive operations', () => {
    cy.fixture('testData').then((data) => {
      // Rapid operations
      cy.get('#text-input').type(data.sampleTexts.emailOnly)
      cy.get('#send-btn').click()
      
      cy.get('#text-input').clear().type(data.sampleTexts.phoneOnly)
      cy.get('#send-btn').click()
      
      cy.get('#text-input').clear().type(data.sampleTexts.withPII)
      cy.get('#send-btn').click()
      
      // Should handle all operations
      cy.get('.chat-message').should('have.length', 3)
    })
  })
})

describe('PII Protector - Data Persistence', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should persist custom terms across sessions', () => {
    const customTerms = ['CompanyName', 'ProjectCode', 'ClientName']
    
    // Set custom terms
    cy.get('#custom-terms').clear().type(customTerms.join('\\n'))
    cy.get('.save-close-btn').click()
    
    // Reload page
    cy.reload()
    cy.wait(1000)
    
    // Terms should be preserved
    cy.get('#custom-terms').should('contain.value', customTerms[0])
  })

  it('should persist dark mode preference', () => {
    // Enable dark mode
    cy.get('#darkMode').click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    
    // Reload page
    cy.reload()
    cy.wait(1000)
    
    // Should remain in dark mode
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('#darkMode').should('be.checked')
  })

  it('should persist sidebar state', () => {
    // Collapse sidebar
    cy.get('#sidebar-toggle-btn').click()
    cy.get('#history-sidebar').should('have.class', 'collapsed')
    
    // Reload page
    cy.reload()
    cy.wait(1000)
    
    // Should remain collapsed
    cy.get('#history-sidebar').should('have.class', 'collapsed')
  })

  it('should persist chat history', () => {
    cy.fixture('testData').then((data) => {
      // Create some history
      cy.typeAndProtect(data.sampleTexts.withPII)
      cy.get('.new-chat-btn').click()
      cy.typeAndProtect(data.sampleTexts.emailOnly)
      
      // Should have 2 history items
      cy.get('.history-item').should('have.length', 2)
      
      // Reload page
      cy.reload()
      cy.wait(1000)
      
      // History should be preserved
      cy.get('.history-item').should('have.length', 2)
    })
  })

  it('should handle storage limits gracefully', () => {
    // Create many history items to test storage limits
    cy.fixture('testData').then((data) => {
      for (let i = 0; i < 25; i++) { // More than the 20 item limit
        cy.typeAndProtect(`${data.sampleTexts.withPII} - ${i}`)
        cy.get('.new-chat-btn').click()
      }
      
      // Should limit to 20 items (or configured limit)
      cy.get('.history-item').should('have.length.at.most', 20)
    })
  })
})

describe('PII Protector - Security Features', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should not expose original PII in DOM when protected', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Switch to protected view
      cy.get('.message-tab').contains('Protected Text').click()
      
      // Original PII should not be visible in protected view
      cy.get('.message-text[data-view="protected"]')
        .should('not.contain', 'john.smith@company.com')
        .should('not.contain', '+1-555-123-4567')
    })
  })

  it('should handle sensitive data in custom terms', () => {
    const sensitiveTerms = ['SecretProject', 'ConfidentialClient', 'InternalCode']
    
    cy.get('#custom-terms').clear().type(sensitiveTerms.join('\\n'))
    
    const textWithSensitive = 'Working on SecretProject for ConfidentialClient using InternalCode'
    cy.typeAndProtect(textWithSensitive)
    
    // Sensitive terms should be protected
    cy.get('.message-text[data-view="protected"]')
      .should('contain', '[LDB_CUSTOM')
      .should('not.contain', 'SecretProject')
      .should('not.contain', 'ConfidentialClient')
  })

  it('should clear sensitive data from input after processing', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Input should be cleared
      cy.get('#text-input').should('have.value', '')
    })
  })
})

describe('PII Protector - Performance Under Load', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should handle large documents efficiently', () => {
    // Create a large document with multiple PII instances
    const largeDoc = `
      Large Document Test
      ===================
      
      ${Array.from({ length: 100 }, (_, i) => 
        `Entry ${i}: Contact user${i}@company.com or call 555-${String(i).padStart(3, '0')}-${String(i + 1000).slice(-4)}`
      ).join('\\n')}
    `
    
    const startTime = Date.now()
    cy.typeAndProtect(largeDoc)
    
    // Should complete within reasonable time
    cy.get('.protection-badge').should('be.visible')
    cy.get('.message-text[data-view="protected"]').should('contain', '[LDB_EMAIL')
    
    // Performance check (basic)
    cy.then(() => {
      const endTime = Date.now()
      const processingTime = endTime - startTime
      expect(processingTime).to.be.lessThan(10000) // Should complete within 10 seconds
    })
  })

  it('should maintain responsiveness with many history items', () => {
    cy.fixture('testData').then((data) => {
      // Create multiple history items
      for (let i = 0; i < 10; i++) {
        cy.typeAndProtect(`${data.sampleTexts.withPII} - Test ${i}`)
        cy.get('.new-chat-btn').click()
      }
      
      // UI should remain responsive
      cy.get('.history-item').should('have.length', 10)
      cy.get('#text-input').should('be.visible')
      cy.get('#send-btn').should('be.visible')
      
      // History navigation should work
      cy.get('.history-item').first().click()
      cy.get('.chat-message').should('be.visible')
    })
  })
})