describe('PII Protector - Core Functionality', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000) // Allow app to initialize
  })

  it('should load the application successfully', () => {
    cy.get('.app-header').should('be.visible')
    cy.get('.app-header h2').should('contain', 'Ledebe Protector')
    cy.get('#text-input').should('be.visible')
    cy.get('#send-btn').should('be.visible')
  })

  it('should show welcome message on first load', () => {
    cy.get('.welcome-prompt').should('be.visible')
    cy.get('.welcome-prompt h2').should('contain', 'Ledebe Protector')
  })

  it('should enable send button when text is entered', () => {
    cy.get('#send-btn').should('be.disabled')
    cy.get('#text-input').type('Hello world')
    cy.get('#send-btn').should('not.be.disabled')
  })

  it('should clear welcome message after sending first message', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withoutPII)
      cy.get('.welcome-prompt').should('not.exist')
    })
  })
})

describe('PII Protector - Text Protection', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should protect email addresses', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.emailOnly)
      
      // Check that email is protected in the protected view
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.email)
        .should('not.contain', 'manager@company.com')
    })
  })

  it('should protect phone numbers', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.phoneOnly)
      
      // Check that phone is protected
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.phone)
        .should('not.contain', '(555) 123-4567')
    })
  })

  it('should protect multiple PII types in one message', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Check protection badge
      cy.get('.protection-badge').should('be.visible')
      cy.get('.protection-badge').should('contain', 'protected')
      
      // Check that both email and phone are protected
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.email)
        .should('contain', data.protectedPatterns.phone)
        .should('not.contain', 'john.smith@company.com')
        .should('not.contain', '+1-555-123-4567')
    })
  })

  it('should handle text without PII', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withoutPII)
      
      // Should show original text since no PII detected
      cy.get('.message-text').should('contain', data.sampleTexts.withoutPII)
    })
  })

  it('should protect custom terms when specified', () => {
    cy.fixture('testData').then((data) => {
      // Add custom terms
      cy.get('#custom-terms').clear().type(data.customTerms.join('\\n'))
      
      // Send message with custom terms
      cy.typeAndProtect(data.sampleTexts.withCustomTerms)
      
      // Check that custom terms are protected
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.custom)
        .should('not.contain', 'TechCorp')
        .should('not.contain', 'Sandra')
    })
  })
})

describe('PII Protector - Message Views', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should switch between plain and protected text views', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Should start with protected view active
      cy.get('.message-tab.active').should('contain', 'Protected Text')
      cy.get('.message-text[data-view="protected"]').should('be.visible')
      
      // Switch to plain text view
      cy.get('.message-tab').contains('Plain Text').click()
      cy.get('.message-tab.active').should('contain', 'Plain Text')
      cy.get('.message-text[data-view="plain"]')
        .should('contain', 'john.smith@company.com')
        .should('contain', '+1-555-123-4567')
      
      // Switch back to protected view
      cy.get('.message-tab').contains('Protected Text').click()
      cy.get('.message-tab.active').should('contain', 'Protected Text')
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.email)
        .should('contain', data.protectedPatterns.phone)
    })
  })
})

describe('PII Protector - Message Actions', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should copy message text to clipboard', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Click copy button
      cy.get('.message-action-btn[data-label="Copy"]').click()
      
      // Note: Testing actual clipboard functionality requires additional setup
      // This test verifies the button exists and is clickable
    })
  })

  it('should delete messages', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Confirm message exists
      cy.get('.chat-message').should('have.length', 1)
      
      // Delete message (stub the confirm dialog)
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })
      
      cy.get('.message-action-btn[data-label="Delete"]').click()
      cy.get('.chat-message').should('have.length', 0)
    })
  })

  it('should edit messages', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withoutPII)
      
      // Edit message (stub the prompt dialog)
      const newText = 'This is edited text'
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns(newText)
      })
      
      cy.get('.message-action-btn[data-label="Edit"]').click()
      cy.get('.message-text').should('contain', newText)
    })
  })
})

describe('PII Protector - History Management', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should save messages to history', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Check that history item is created
      cy.get('.history-item').should('have.length', 1)
      cy.get('.history-item').should('contain', data.sampleTexts.withPII.substring(0, 20))
    })
  })

  it('should load history items', () => {
    cy.fixture('testData').then((data) => {
      // Send first message
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Start new chat
      cy.get('.new-chat-btn').click()
      cy.get('.chat-message').should('have.length', 0)
      
      // Load previous history item
      cy.get('.history-item').first().click()
      cy.get('.chat-message').should('have.length', 1)
    })
  })

  it('should create new chat', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      cy.get('.chat-message').should('have.length', 1)
      
      // Create new chat
      cy.get('.new-chat-btn').click()
      
      // Should clear messages and show welcome
      cy.get('.chat-message').should('have.length', 0)
      cy.get('.welcome-prompt').should('be.visible')
    })
  })

  it('should rename history items', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      const newName = 'Renamed Chat'
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns(newName)
      })
      
      // Open history menu and rename
      cy.get('.history-actions button').click()
      cy.get('.history-menu-item').contains('Rename').click()
      cy.get('.history-item-text').should('contain', newName)
    })
  })

  it('should delete history items', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      cy.get('.history-item').should('have.length', 1)
      
      // Confirm deletion
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true)
      })
      
      // Delete history item
      cy.get('.history-actions button').click()
      cy.get('.history-menu-item.delete').click()
      cy.get('.history-item').should('have.length', 0)
    })
  })
})

describe('PII Protector - Custom Terms', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should save custom terms', () => {
    cy.fixture('testData').then((data) => {
      // Add custom terms
      cy.get('#custom-terms').clear().type(data.customTerms.join('\\n'))
      
      // Save terms
      cy.get('.save-close-btn').click()
      
      // Reload page and check if terms are saved
      cy.reload()
      cy.wait(1000)
      cy.get('#custom-terms').should('contain.value', data.customTerms[0])
    })
  })

  it('should use custom terms for protection', () => {
    cy.fixture('testData').then((data) => {
      // Add custom terms
      cy.get('#custom-terms').clear().type(data.customTerms.join('\\n'))
      
      // Send message with custom terms
      cy.typeAndProtect(data.sampleTexts.withCustomTerms)
      
      // Verify custom terms are protected
      cy.get('.message-text[data-view="protected"]')
        .should('contain', data.protectedPatterns.custom)
    })
  })
})

describe('PII Protector - Dark Mode', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should toggle dark mode', () => {
    // Should start in light mode
    cy.get('html').should('have.attr', 'data-theme', 'light')
    
    // Toggle to dark mode
    cy.get('#darkMode').click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    
    // Toggle back to light mode
    cy.get('#darkMode').click()
    cy.get('html').should('have.attr', 'data-theme', 'light')
  })

  it('should persist dark mode preference', () => {
    // Enable dark mode
    cy.get('#darkMode').click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    
    // Reload page
    cy.reload()
    cy.wait(1000)
    
    // Should still be in dark mode
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('#darkMode').should('be.checked')
  })
})

describe('PII Protector - Keyboard Shortcuts', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should send message with Ctrl+Enter', () => {
    cy.fixture('testData').then((data) => {
      cy.get('#text-input').type(data.sampleTexts.withoutPII)
      cy.get('#text-input').type('{ctrl+enter}')
      
      cy.get('.chat-message').should('have.length', 1)
    })
  })

  it('should create new chat with Ctrl+K', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withoutPII)
      cy.get('.chat-message').should('have.length', 1)
      
      // Use keyboard shortcut for new chat
      cy.get('body').type('{ctrl+k}')
      
      cy.get('.chat-message').should('have.length', 0)
      cy.get('.welcome-prompt').should('be.visible')
    })
  })

  it('should show shortcuts modal with Ctrl+/', () => {
    cy.get('body').type('{ctrl+/}')
    cy.get('#shortcuts-modal').should('have.class', 'show')
    
    // Close with Escape
    cy.get('body').type('{esc}')
    cy.get('#shortcuts-modal').should('not.have.class', 'show')
  })
})

describe('PII Protector - Sidebar', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should toggle sidebar', () => {
    cy.get('#history-sidebar').should('not.have.class', 'collapsed')
    
    // Toggle sidebar
    cy.get('#sidebar-toggle-btn').click()
    cy.get('#history-sidebar').should('have.class', 'collapsed')
    
    // Toggle back
    cy.get('#sidebar-toggle-btn').click()
    cy.get('#history-sidebar').should('not.have.class', 'collapsed')
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
})

describe('PII Protector - Error Handling', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should handle empty input gracefully', () => {
    cy.get('#send-btn').should('be.disabled')
    cy.get('#text-input').type('   ') // Only whitespace
    cy.get('#send-btn').should('be.disabled')
  })

  it('should handle very long text', () => {
    const longText = 'A'.repeat(10000)
    cy.get('#text-input').type(longText)
    cy.get('#send-btn').click()
    
    // Should still process without errors
    cy.waitForProtection()
    cy.get('.chat-message').should('have.length', 1)
  })
})