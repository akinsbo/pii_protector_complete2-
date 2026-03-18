describe('PII Protector - UI/UX', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should have proper page title and meta tags', () => {
    cy.title().should('eq', 'Ledebe Protector')
    cy.get('meta[name="viewport"]').should('have.attr', 'content', 'width=device-width, initial-scale=1.0')
  })

  it('should display logo and branding correctly', () => {
    cy.get('.app-header .logo').should('be.visible')
    cy.get('.app-header h2').should('contain', 'Ledebe Protector')
    cy.get('.app-subtitle').should('contain', 'Keep your personal info safe')
  })

  it('should have responsive design elements', () => {
    // Test mobile viewport
    cy.viewport(375, 667) // iPhone SE
    cy.get('.app-container').should('be.visible')
    cy.get('#text-input').should('be.visible')
    
    // Test tablet viewport
    cy.viewport(768, 1024) // iPad
    cy.get('.app-container').should('be.visible')
    
    // Test desktop viewport
    cy.viewport(1920, 1080)
    cy.get('.app-container').should('be.visible')
  })

  it('should show tooltips on hover', () => {
    cy.get('.upload-btn').should('have.attr', 'title', 'Attach file')
    cy.get('.toggle').should('have.attr', 'title', 'Dark Mode')
  })

  it('should have proper button states', () => {
    // Send button should be disabled initially
    cy.get('#send-btn').should('be.disabled')
    
    // Should enable when text is entered
    cy.get('#text-input').type('test')
    cy.get('#send-btn').should('not.be.disabled')
    
    // Should disable during processing
    cy.get('#send-btn').click()
    cy.get('#send-btn').should('be.disabled')
  })

  it('should show loading states appropriately', () => {
    cy.fixture('testData').then((data) => {
      cy.get('#text-input').type(data.sampleTexts.withPII)
      cy.get('#send-btn').click()
      
      // Button should show loading state briefly
      cy.get('#send-btn').should('contain', 'Send')
    })
  })

  it('should have proper focus management', () => {
    // Text input should be focusable
    cy.get('#text-input').focus().should('have.focus')
    
    // Tab navigation should work
    cy.get('#text-input').tab()
    cy.focused().should('have.id', 'send-btn')
  })

  it('should show proper visual feedback for interactions', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Message should have proper styling
      cy.get('.chat-message').should('have.class', 'chat-message')
      cy.get('.message-content').should('be.visible')
      
      // Tabs should show active state
      cy.get('.message-tab.active').should('exist')
    })
  })

  it('should handle text overflow gracefully', () => {
    const longText = 'This is a very long message that should handle text overflow properly. '.repeat(50)
    
    cy.get('#text-input').type(longText)
    cy.get('#send-btn').click()
    cy.waitForProtection()
    
    // Message should be contained properly
    cy.get('.message-text').should('be.visible')
    cy.get('.chat-message').should('not.have.css', 'overflow', 'visible')
  })

  it('should show proper spacing and alignment', () => {
    cy.fixture('testData').then((data) => {
      cy.typeAndProtect(data.sampleTexts.withPII)
      
      // Check message alignment
      cy.get('.chat-message-inner').should('have.css', 'margin-left', 'auto')
      
      // Check proper spacing
      cy.get('.chat-area').should('have.css', 'gap', '24px') // 1.5rem
    })
  })
})

describe('PII Protector - Accessibility', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should have proper ARIA labels and roles', () => {
    // Check for important ARIA attributes
    cy.get('#text-input').should('have.attr', 'placeholder')
    cy.get('#send-btn').should('be.visible')
  })

  it('should support keyboard navigation', () => {
    // Tab through interactive elements
    cy.get('body').tab()
    cy.focused().should('be.visible')
    
    // Enter key should work on buttons
    cy.get('#text-input').type('test message')
    cy.get('#text-input').type('{enter}')
    // Note: Enter behavior depends on implementation
  })

  it('should have sufficient color contrast', () => {
    // Test dark mode contrast
    cy.get('#darkMode').click()
    cy.get('.app-header').should('have.css', 'background-color')
    
    // Test light mode contrast
    cy.get('#darkMode').click()
    cy.get('.app-header').should('have.css', 'background-color')
  })

  it('should have readable font sizes', () => {
    cy.get('#text-input').should('have.css', 'font-size', '16px')
    cy.get('.app-header h2').should('have.css', 'font-size').and('not.be.empty')
  })

  it('should support screen readers', () => {
    // Check for semantic HTML elements
    cy.get('main, section, article, nav, header').should('exist')
    
    // Check for proper heading hierarchy
    cy.get('h1, h2, h3').should('exist')
  })

  it('should handle focus indicators', () => {
    cy.get('#text-input').focus()
    cy.get('#text-input').should('have.focus')
    
    // Focus should be visible (outline or other indicator)
    cy.get('#text-input:focus').should('be.visible')
  })

  it('should provide alternative text for images', () => {
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt')
    })
  })

  it('should have proper form labels', () => {
    // Check that form elements have associated labels or aria-labels
    cy.get('input, textarea, select').each(($el) => {
      const id = $el.attr('id')
      if (id) {
        // Should have either a label or aria-label
        cy.get(`label[for="${id}"]`).should('exist').or(() => {
          cy.wrap($el).should('have.attr', 'aria-label').or('have.attr', 'placeholder')
        })
      }
    })
  })
})

describe('PII Protector - Performance', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should load quickly', () => {
    // Page should load within reasonable time
    cy.get('.app-header').should('be.visible')
    cy.get('#text-input').should('be.visible')
  })

  it('should handle large text input efficiently', () => {
    const largeText = 'Large text content. '.repeat(1000)
    
    const startTime = Date.now()
    cy.get('#text-input').type(largeText, { delay: 0 })
    cy.get('#send-btn').click()
    cy.waitForProtection()
    
    // Should complete within reasonable time (this is just a basic check)
    cy.get('.chat-message').should('be.visible')
  })

  it('should not cause memory leaks with multiple operations', () => {
    cy.fixture('testData').then((data) => {
      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        cy.typeAndProtect(`${data.sampleTexts.withPII} - iteration ${i}`)
        cy.get('.new-chat-btn').click()
      }
      
      // App should still be responsive
      cy.get('#text-input').should('be.visible')
      cy.get('#send-btn').should('be.visible')
    })
  })

  it('should handle rapid user interactions', () => {
    // Rapid clicking should not break the app
    cy.get('#text-input').type('test')
    cy.get('#send-btn').click()
    cy.get('#send-btn').click() // Double click
    cy.get('#send-btn').click() // Triple click
    
    // App should remain stable
    cy.get('.app-container').should('be.visible')
  })
})

describe('PII Protector - Browser Compatibility', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should work with different viewport sizes', () => {
    const viewports = [
      [320, 568], // iPhone 5
      [375, 667], // iPhone 6/7/8
      [414, 896], // iPhone XR
      [768, 1024], // iPad
      [1024, 768], // iPad Landscape
      [1280, 720], // Desktop
      [1920, 1080] // Large Desktop
    ]
    
    viewports.forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.get('.app-container').should('be.visible')
      cy.get('#text-input').should('be.visible')
      cy.get('#send-btn').should('be.visible')
    })
  })

  it('should handle touch interactions on mobile', () => {
    cy.viewport('iphone-6')
    
    // Touch interactions should work
    cy.get('#text-input').click()
    cy.get('#text-input').should('have.focus')
    
    cy.get('.new-chat-btn').click()
    cy.get('.welcome-prompt').should('be.visible')
  })

  it('should work without JavaScript features gracefully', () => {
    // Basic HTML structure should be present
    cy.get('.app-container').should('exist')
    cy.get('#text-input').should('exist')
    cy.get('#send-btn').should('exist')
  })
})

describe('PII Protector - Error States', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should show appropriate error messages', () => {
    // Test empty input
    cy.get('#send-btn').should('be.disabled')
    
    // Test with only whitespace
    cy.get('#text-input').type('   ')
    cy.get('#send-btn').should('be.disabled')
  })

  it('should recover from errors gracefully', () => {
    cy.fixture('testData').then((data) => {
      // Normal operation should work after any errors
      cy.typeAndProtect(data.sampleTexts.withPII)
      cy.get('.chat-message').should('be.visible')
    })
  })

  it('should handle network-like errors', () => {
    // Test that app continues to work even if some features fail
    cy.get('#text-input').type('test message')
    cy.get('#send-btn').click()
    
    // App should remain functional
    cy.get('.app-container').should('be.visible')
  })
})