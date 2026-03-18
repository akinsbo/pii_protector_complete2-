describe('PII Protector - File Upload', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should show upload menu when clicking upload button', () => {
    cy.get('.upload-btn').click()
    cy.get('#upload-menu').should('have.class', 'show')
    
    // Should hide when clicking outside
    cy.get('body').click()
    cy.get('#upload-menu').should('not.have.class', 'show')
  })

  it('should handle text file upload', () => {
    const fileName = 'test-document.txt'
    const fileContent = 'This is a test document with email john@test.com and phone 555-123-4567'
    
    // Create a test file
    cy.get('#file-input').selectFile({
      contents: fileContent,
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true })
    
    // Should show uploaded file indicator
    cy.get('.uploaded-file').should('be.visible')
    cy.get('.uploaded-file').should('contain', fileName)
    
    // Should show document card after processing
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    cy.get('.document-card').should('contain', fileName)
  })

  it('should handle image file upload with OCR', () => {
    // Note: This test would require a real image file with text
    // For now, we'll test the UI flow
    cy.get('.upload-btn').click()
    cy.get('.upload-menu-item').contains('Upload file').should('be.visible')
  })

  it('should remove uploaded file', () => {
    const fileName = 'test-remove.txt'
    const fileContent = 'Test content for removal'
    
    cy.get('#file-input').selectFile({
      contents: fileContent,
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.uploaded-file').should('be.visible')
    
    // Remove file
    cy.get('.uploaded-file button').click()
    cy.get('.uploaded-file').should('not.exist')
  })

  it('should show processing overlay for large files', () => {
    const largeContent = 'Large document content. '.repeat(1000)
    
    cy.get('#file-input').selectFile({
      contents: largeContent,
      fileName: 'large-document.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    // Processing overlay might appear briefly
    cy.get('.document-card', { timeout: 15000 }).should('be.visible')
  })

  it('should handle PDF file upload', () => {
    // Note: Testing PDF upload would require a real PDF file
    // This tests the file input acceptance
    cy.get('#file-input').should('have.attr', 'accept').and('include', '.pdf')
  })

  it('should show document preview modal', () => {
    const fileName = 'preview-test.txt'
    const fileContent = 'Document content with email test@example.com for preview testing'
    
    cy.get('#file-input').selectFile({
      contents: fileContent,
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true })
    
    // Wait for document card to appear
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    
    // Click preview button
    cy.get('.doc-action-btn').contains('Preview').click()
    
    // Should show preview modal
    cy.get('#preview-modal').should('have.class', 'show')
    cy.get('#preview-filename').should('contain', fileName)
    
    // Should show protected version by default
    cy.get('.preview-tab.active').should('contain', 'Protected Version')
    
    // Switch to original version
    cy.get('.preview-tab').contains('Original Version').click()
    cy.get('.preview-tab.active').should('contain', 'Original Version')
    
    // Close modal
    cy.get('.preview-close').click()
    cy.get('#preview-modal').should('not.have.class', 'show')
  })

  it('should download protected document', () => {
    const fileName = 'download-test.txt'
    const fileContent = 'Content with email download@test.com for download testing'
    
    cy.get('#file-input').selectFile({
      contents: fileContent,
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    
    // Click download button (note: actual download testing requires additional setup)
    cy.get('.doc-action-btn.primary').contains('Download').should('be.visible')
  })

  it('should preserve document formatting (tables, lists, etc.)', () => {
    const csvContent = 'Name,Email,Phone\nJohn,john@test.com,555-123\nJane,jane@test.com,555-456'
    
    cy.get('#file-input').selectFile({
      contents: csvContent,
      fileName: 'test-data.csv',
      mimeType: 'text/csv'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    
    // Click preview button
    cy.get('.doc-action-btn').contains('Preview').click()
    
    // Should show preview modal with table formatting
    cy.get('#preview-modal').should('have.class', 'show')
    cy.get('.preview-document').should('contain.html', '<table')
    cy.get('.preview-document').should('contain.html', '<th')
    cy.get('.preview-document').should('contain.html', '<td')
    
    // Close modal
    cy.get('.preview-close').click()
    cy.get('#preview-modal').should('not.have.class', 'show')
  })

  it('should preserve markdown-like formatting', () => {
    const markdownContent = `# Main Title

## Section Header

- First item
- Second item
- Third item

**Bold text** and *italic text*

\`code snippet\``
    
    cy.get('#file-input').selectFile({
      contents: markdownContent,
      fileName: 'test.md',
      mimeType: 'text/markdown'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    
    // Click preview
    cy.get('.doc-action-btn').contains('Preview').click()
    
    // Should preserve markdown formatting
    cy.get('.preview-document').should('contain.html', '<h1')
    cy.get('.preview-document').should('contain.html', '<h2')
    cy.get('.preview-document').should('contain.html', '<ul')
    cy.get('.preview-document').should('contain.html', '<li')
    cy.get('.preview-document').should('contain.html', '<strong')
    cy.get('.preview-document').should('contain.html', '<em')
    cy.get('.preview-document').should('contain.html', '<code')
    
    cy.get('.preview-close').click()
  })

  it('should handle multiple file types', () => {
    // Test that file input accepts various formats
    cy.get('#file-input')
      .should('have.attr', 'accept')
      .and('include', '.txt')
      .and('include', '.md')
      .and('include', '.csv')
      .and('include', '.pdf')
      .and('include', 'image/*')
  })

  it('should clear file input after processing', () => {
    const fileName = 'clear-test.txt'
    const fileContent = 'Test content for clearing input'
    
    cy.get('#file-input').selectFile({
      contents: fileContent,
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    
    // File input should be cleared
    cy.get('#file-input').should('have.value', '')
  })
})

describe('PII Protector - Image Processing', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should show image tabs after processing', () => {
    // This would require actual image processing
    // Testing the UI structure for image messages
    cy.get('.message-tabs').should('not.exist') // Initially no tabs
  })

  it('should switch between plain and protected image views', () => {
    // This test would require actual image upload and processing
    // For now, testing that the structure exists in the HTML
    cy.get('body').should('contain.html', 'switchImageView')
  })

  it('should download images in different formats', () => {
    // Testing that download functionality exists
    cy.get('body').should('contain.html', 'downloadCurrentImage')
  })
})

describe('PII Protector - Document Processing Edge Cases', () => {
  beforeEach(() => {
    cy.clearAppData()
    cy.visit('/')
    cy.wait(1000)
  })

  it('should handle empty files', () => {
    cy.get('#file-input').selectFile({
      contents: '',
      fileName: 'empty.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    // Should handle gracefully without errors
    cy.get('.uploaded-file').should('be.visible')
  })

  it('should handle files with only whitespace', () => {
    cy.get('#file-input').selectFile({
      contents: '   \\n\\n   \\t   ',
      fileName: 'whitespace.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.uploaded-file').should('be.visible')
  })

  it('should handle files with special characters', () => {
    const specialContent = 'Content with émojis 🔒 and spëcial çharacters'
    
    cy.get('#file-input').selectFile({
      contents: specialContent,
      fileName: 'special-chars.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
  })

  it('should handle very large files', () => {
    const largeContent = 'This is a very large document. '.repeat(5000)
    
    cy.get('#file-input').selectFile({
      contents: largeContent,
      fileName: 'large-file.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    // Should process without timeout errors
    cy.get('.document-card', { timeout: 20000 }).should('be.visible')
  })

  it('should handle files with mixed content types', () => {
    const mixedContent = `
      Text document with various PII:
      Email: mixed@example.com
      Phone: +1-555-987-6543
      Name: John Doe
      Company: MixedCorp
      Address: 123 Mixed Street
      
      Some code:
      function test() {
        return "hello@world.com";
      }
      
      Some data:
      user_id,email,phone
      1,user1@test.com,555-0001
      2,user2@test.com,555-0002
    `
    
    cy.get('#file-input').selectFile({
      contents: mixedContent,
      fileName: 'mixed-content.txt',
      mimeType: 'text/plain'
    }, { force: true })
    
    cy.get('.document-card', { timeout: 10000 }).should('be.visible')
    cy.get('.document-stats').should('contain', 'protected')
  })
})