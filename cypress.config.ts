import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'QA testing/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'QA testing/cypress/support/e2e.ts',
    fixturesFolder: 'QA testing/cypress/fixtures',
  },
  component: {
    devServer: {
      framework: 'vite',
      bundler: 'vite',
    },
  },
})