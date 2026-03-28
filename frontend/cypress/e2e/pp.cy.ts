/// <reference types="cypress" />

describe('Dashboard Page', () => {
  it('should load dashboard', () => {
    cy.visit('http://localhost:4200');

    cy.contains('Smart Document System', { timeout: 10000 })
      .should('be.visible');

    cy.contains('Dashboard').should('be.visible');
    cy.contains('Upload Document').should('be.visible');
    cy.contains('Documents').should('be.visible');
    cy.contains('Search').should('be.visible');
  });
});
