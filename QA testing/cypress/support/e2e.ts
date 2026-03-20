// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import 'cypress-plugin-tab'

// Alternatively you can use CommonJS syntax:
// require('./commands')

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to wait for text protection to complete
       */
      waitForProtection(): Chainable<void>
      
      /**
       * Custom command to clear all app data
       */
      clearAppData(): Chainable<void>
      
      /**
       * Custom command to type text with protection
       */
      typeAndProtect(text: string): Chainable<void>
    }
  }
}