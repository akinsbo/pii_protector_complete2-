// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to select elements by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

// Custom command to wait for protection to complete
Cypress.Commands.add('waitForProtection', () => {
  cy.get('#send-btn').should('not.be.disabled')
  cy.get('.processing-overlay').should('not.have.class', 'show')
})

// Custom command to clear all app data
Cypress.Commands.add('clearAppData', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})

// Custom command to type text and protect it
Cypress.Commands.add('typeAndProtect', (text: string) => {
  cy.get('#text-input').clear().type(text)
  cy.get('#send-btn').click()
  cy.waitForProtection()
})